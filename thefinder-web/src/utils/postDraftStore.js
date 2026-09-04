let expandedPostDraft = null;

export function savePostDraft(draft) {
  expandedPostDraft = draft;
}

export function consumePostDraft(type) {
  if (!expandedPostDraft || expandedPostDraft.type !== type) return null;
  const draft = expandedPostDraft;
  expandedPostDraft = null;
  return draft;
}

export function clearPostDraft() {
  expandedPostDraft = null;
}
