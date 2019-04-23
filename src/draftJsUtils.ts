import { EditorState, SelectionState, Modifier, RichUtils } from 'draft-js';
import { List } from 'immutable';

// From js-utils
export function getSelectedBlocksList(editorState: EditorState): List<Draft.ContentBlock> {
  const selectionState = editorState.getSelection();
  const contentState = editorState.getCurrentContent();
  const startKey = selectionState.getStartKey();
  const endKey = selectionState.getEndKey();
  const blockMap = contentState.getBlockMap();

  return blockMap.toSeq()
    .skipUntil((_, k) => k === startKey)
    .takeUntil((_, k) => k === endKey)
    .concat([[endKey, blockMap.get(endKey)]])
    .toList();
}

export function getSelectionCustomStyles(
  editorState: EditorState,
  customStyles: string[]
): string[] {
  if (!customStyles.length || !editorState)
    return [];

  const currentSelection = editorState.getSelection();

  if (currentSelection.isCollapsed()) {
    return editorState.getCurrentInlineStyle().toArray().filter(s => customStyles.includes(s));
  } else {
    const foundStyles: string[] = [];
    const start = currentSelection.getStartOffset();
    const end = currentSelection.getEndOffset();
    const selectedBlocks = getSelectedBlocksList(editorState);

    if (selectedBlocks.size > 0) {
      for (let i = 0; i < selectedBlocks.size; i += 1) {
        let blockStart = i === 0 ? start : 0;
        let blockEnd = i === (selectedBlocks.size - 1) ? end : selectedBlocks.get(i).getText().length;
        if (blockStart === blockEnd && blockStart === 0) {
          blockStart = 1;
          blockEnd = 2;
        } else if (blockStart === blockEnd) {
          blockStart -= 1;
        }

        for (let j = blockStart; j < blockEnd; j += 1) {
          const inlineStylesAtOffset = selectedBlocks.get(i).getInlineStyleAt(j);

          if (inlineStylesAtOffset) {
            foundStyles.push(
              ...inlineStylesAtOffset.toArray().filter(s =>
                !foundStyles.includes(s) && customStyles.includes(s)
              )
            );
            if (customStyles.length === foundStyles.length)
              return foundStyles;
          }
        }
      }
    }

    return foundStyles;
  }
}

export function getFocusedEditorState(
  editorState: EditorState,
): EditorState {
  const selectionState = editorState.getSelection();

  // Restore focus to last position, if not there already
  if (!selectionState.getHasFocus()) {
    const restoreFocusSelection = selectionState.merge({
      anchorOffset: selectionState.getAnchorOffset(),
      focusOffset: selectionState.getFocusOffset(),
      hasFocus: true
    }) as SelectionState;

    return EditorState.forceSelection(editorState, restoreFocusSelection);
  }

  return editorState;
}

export function toggleMutuallyExclusiveCustomInlineStyle(
  toggleStyle: string,
  editorState: EditorState,
  mutuallyExclusiveCustomStyleMap: { [style: string]: { [key: string]: any } },
  setEditorState: (editorState: EditorState) => void
) {
  let newEditorState = getFocusedEditorState(editorState);
  const selectionState = newEditorState.getSelection();

  // Selecting text -> Make sure any style is overlapping
  if (!selectionState.isCollapsed()) {
    Object.keys(mutuallyExclusiveCustomStyleMap).forEach(style => {
      newEditorState = EditorState.push(
        newEditorState,
        Modifier.removeInlineStyle(newEditorState.getCurrentContent(), selectionState, style),
        'change-inline-style'
      );
    });
  } else { // Cursor only
    const activeStyle = newEditorState.getCurrentInlineStyle().toMap().findKey((v, k) => {
      return Object.keys(mutuallyExclusiveCustomStyleMap).some(s => s === k);
    });

    if (activeStyle)
      newEditorState = RichUtils.toggleInlineStyle(newEditorState, activeStyle);
  }

  setEditorState(RichUtils.toggleInlineStyle(newEditorState, toggleStyle));
}