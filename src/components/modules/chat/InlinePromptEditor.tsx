"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import {
  formatPromptTag,
  tokenizePromptText,
  type PromptItem,
} from "@/lib/prompt-library";
import { cn } from "@/lib/utils";

export interface EditorTextRange {
  start: number;
  end: number;
}

export interface InlinePromptEditorHandle {
  focus: () => void;
  replaceRange: (range: EditorTextRange, replacement?: string) => void;
  insertPrompt: (prompt: PromptItem, range: EditorTextRange) => void;
}

interface InlinePromptEditorProps {
  value: string;
  disabled?: boolean;
  placeholder: string;
  className?: string;
  onValueChange: (value: string, cursor: number) => void;
  onCaretChange?: (value: string, cursor: number) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  onPasteFiles?: (files: File[]) => void;
}

const promptTagFromElement = (element: Element): string | null =>
  element instanceof HTMLElement ? (element.dataset.promptTag ?? null) : null;

const serializeNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replaceAll("\u00a0", " ");
  }

  if (!(node instanceof Element)) {
    return [...node.childNodes].map(serializeNode).join("");
  }
  const promptTag = promptTagFromElement(node);
  if (promptTag) return promptTag;
  if (node.tagName === "BR") return "\n";

  const content = [...node.childNodes].map(serializeNode).join("");
  if (node.tagName === "DIV" || node.tagName === "P") {
    return `\n${content}`;
  }
  return content;
};

const serializeEditor = (root: HTMLElement): string =>
  [...root.childNodes].map(serializeNode).join("").replace(/^\n/, "");

const getCaretOffset = (root: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return serializeEditor(root).length;

  const selectedRange = selection.getRangeAt(0);
  if (!root.contains(selectedRange.startContainer)) {
    return serializeEditor(root).length;
  }

  const prefix = document.createRange();
  prefix.setStart(root, 0);
  prefix.setEnd(selectedRange.startContainer, selectedRange.startOffset);
  return serializeNode(prefix.cloneContents()).length;
};

const placeCaret = (root: HTMLElement, targetOffset: number) => {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  let consumed = 0;
  let placed = false;

  const visit = (node: Node) => {
    if (placed) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const length = serializeNode(node).length;
      if (targetOffset <= consumed + length) {
        range.setStart(node, Math.max(0, targetOffset - consumed));
        range.collapse(true);
        placed = true;
        return;
      }
      consumed += length;
      return;
    }

    if (!(node instanceof Element)) return;
    const promptTag = promptTagFromElement(node);
    if (promptTag) {
      const parent = node.parentNode;
      if (!parent) return;
      const index = [...parent.childNodes].indexOf(node);
      if (targetOffset <= consumed) {
        range.setStart(parent, index);
        range.collapse(true);
        placed = true;
        return;
      }
      consumed += promptTag.length;
      if (targetOffset <= consumed) {
        range.setStart(parent, index + 1);
        range.collapse(true);
        placed = true;
      }
      return;
    }

    for (const child of node.childNodes) visit(child);
  };

  for (const child of root.childNodes) visit(child);
  if (!placed) {
    range.selectNodeContents(root);
    range.collapse(false);
  }

  selection.removeAllRanges();
  selection.addRange(range);
};

const createRemoveIcon = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("size-3");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M18 6 6 18M6 6l12 12");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-linecap", "round");
  svg.append(path);
  return svg;
};

const createPromptChip = (
  tag: ReturnType<typeof tokenizePromptText>[number],
) => {
  if (tag.type !== "prompt") return null;

  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.promptTag = tag.tag.rawTag;
  chip.className =
    "mx-0.5 inline-flex max-w-[min(16rem,65vw)] items-center gap-0 align-baseline rounded-full border border-black/10 bg-black/5 py-0 pe-0 ps-2.5 text-[12px] font-medium leading-[22px] text-neutral-700 select-none dark:border-white/10 dark:bg-white/10 dark:text-neutral-300";
  chip.setAttribute("aria-label", `Prompt: ${tag.tag.title}`);

  const title = document.createElement("span");
  title.className = "truncate";
  title.textContent = tag.tag.title;

  const remove = document.createElement("button");
  remove.type = "button";
  remove.dataset.removePrompt = "true";
  remove.className =
    "ms-1.5 me-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-colors hover:bg-black/10 hover:text-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-400 dark:hover:bg-white/15 dark:hover:text-neutral-200";
  remove.setAttribute("aria-label", `Remove ${tag.tag.title} prompt`);
  remove.append(createRemoveIcon());

  chip.append(title, remove);
  return chip;
};

export const InlinePromptEditor = forwardRef<
  InlinePromptEditorHandle,
  InlinePromptEditorProps
>(
  (
    {
      value,
      disabled = false,
      placeholder,
      className,
      onValueChange,
      onCaretChange,
      onKeyDown,
      onPasteFiles,
    },
    forwardedRef,
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);

    const updateEmptyState = useCallback((root: HTMLElement) => {
      root.dataset.empty =
        serializeEditor(root).length === 0 ? "true" : "false";
    }, []);

    const renderValue = useCallback(
      (nextValue: string, caretOffset?: number) => {
        const root = editorRef.current;
        if (!root) return;

        const fragment = document.createDocumentFragment();
        for (const part of tokenizePromptText(nextValue)) {
          if (part.type === "text") {
            fragment.append(document.createTextNode(part.text));
          } else {
            const chip = createPromptChip(part);
            if (chip) fragment.append(chip);
          }
        }

        root.replaceChildren(fragment);
        updateEmptyState(root);
        if (caretOffset !== undefined) placeCaret(root, caretOffset);
      },
      [updateEmptyState],
    );

    const emitChange = useCallback(() => {
      const root = editorRef.current;
      if (!root) return;
      const nextValue = serializeEditor(root);
      updateEmptyState(root);
      onValueChange(nextValue, getCaretOffset(root));
    }, [onValueChange, updateEmptyState]);

    const replaceRange = useCallback(
      (range: EditorTextRange, replacement = "") => {
        const root = editorRef.current;
        if (!root) return;
        const currentValue = serializeEditor(root);
        const nextValue = `${currentValue.slice(0, range.start)}${replacement}${currentValue.slice(range.end)}`;
        const caretOffset = range.start + replacement.length;
        renderValue(nextValue, caretOffset);
        onValueChange(nextValue, caretOffset);
        root.focus();
      },
      [onValueChange, renderValue],
    );

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => editorRef.current?.focus(),
        replaceRange,
        insertPrompt: (prompt, range) => {
          const root = editorRef.current;
          if (!root) return;
          const currentValue = serializeEditor(root);
          const tag = formatPromptTag(prompt);
          const after = currentValue.slice(range.end);
          const spacer = after.startsWith(" ") ? "" : " ";
          const replacement = `${tag}${spacer}`;
          replaceRange(range, replacement);
        },
      }),
      [replaceRange],
    );

    useEffect(() => {
      const root = editorRef.current;
      if (!root || serializeEditor(root) === value) return;
      renderValue(
        value,
        document.activeElement === root ? value.length : undefined,
      );
    }, [renderValue, value]);

    const handleInput = () => emitChange();

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      const removeButton = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-remove-prompt]",
      );
      if (removeButton) {
        event.preventDefault();
        event.stopPropagation();
        const chip = removeButton.closest<HTMLElement>("[data-prompt-tag]");
        const root = editorRef.current;
        if (!chip || !root) return;

        const prefix = document.createRange();
        prefix.setStart(root, 0);
        prefix.setEndBefore(chip);
        const start = serializeNode(prefix.cloneContents()).length;
        const tagLength = chip.dataset.promptTag?.length ?? 0;
        replaceRange({ start, end: start + tagLength });
        return;
      }

      const root = editorRef.current;
      if (root) onCaretChange?.(serializeEditor(root), getCaretOffset(root));
    };

    const insertPlainText = (text: string) => {
      const selection = window.getSelection();
      const root = editorRef.current;
      if (!selection?.rangeCount || !root) return;
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      emitChange();
    };

    const handleCopy = (event: ClipboardEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      const root = editorRef.current;
      if (!selection || !selection.rangeCount || !root) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) return;

      // Clone the selected DOM fragment and serialize it — prompt chips become
      // their raw [prompt:id|title|b64] tag strings automatically via serializeNode.
      const fragment = range.cloneContents();
      const wrapper = document.createElement("div");
      wrapper.append(fragment);
      const rawText = serializeNode(wrapper);

      event.preventDefault();
      event.clipboardData.setData("text/plain", rawText);
    };

    const handleCut = (event: ClipboardEvent<HTMLDivElement>) => {
      handleCopy(event);
      if (event.defaultPrevented) {
        // Copy succeeded — now delete the selected content
        const selection = window.getSelection();
        if (selection && selection.rangeCount) {
          selection.getRangeAt(0).deleteContents();
          emitChange();
        }
      }
    };

    const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
      const files = [...event.clipboardData.files];
      if (files.length > 0 && onPasteFiles) {
        event.preventDefault();
        onPasteFiles(files);
        return;
      }

      event.preventDefault();
      const pasted = event.clipboardData.getData("text/plain");
      if (!pasted) return;

      const root = editorRef.current;
      const selection = window.getSelection();
      if (!root || !selection?.rangeCount) return;

      // Delete any selected content so we get an accurate caret position
      const domRange = selection.getRangeAt(0);
      domRange.deleteContents();

      // Read the serialized value and caret *after* the deletion
      const currentValue = serializeEditor(root);
      const caretPos = getCaretOffset(root);

      // Splice the pasted text in at the caret
      const newValue =
        currentValue.slice(0, caretPos) + pasted + currentValue.slice(caretPos);
      const newCaret = caretPos + pasted.length;

      // renderValue always runs tokenizePromptText, so [prompt:...] tags in
      // pasted text are immediately converted to chips instead of sitting as
      // raw text that the useEffect guard would skip (DOM === state → no re-render).
      renderValue(newValue, newCaret);
      onValueChange(newValue, newCaret);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault();
        insertPlainText("\n");
      }
    };

    return (
      <div
        ref={editorRef}
        id="chat-input-editor"
        role="textbox"
        aria-label={placeholder}
        aria-multiline="true"
        aria-disabled={disabled}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-empty="true"
        data-placeholder={placeholder}
        onClick={handleClick}
        onCopy={handleCopy}
        onCut={handleCut}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={() => {
          const root = editorRef.current;
          if (root)
            onCaretChange?.(serializeEditor(root), getCaretOffset(root));
        }}
        onPaste={handlePaste}
        className={cn(
          "font-body-md text-on-surface placeholder:text-gray-medium before:text-gray-medium min-h-[28px] w-full min-w-0 cursor-text bg-transparent text-left text-sm leading-7 break-words whitespace-pre-wrap outline-none before:pointer-events-none before:content-[attr(data-placeholder)] aria-disabled:cursor-not-allowed aria-disabled:opacity-50 data-[empty=false]:before:content-none",
          className,
        )}
      />
    );
  },
);

InlinePromptEditor.displayName = "InlinePromptEditor";
