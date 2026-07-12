import { reconcileByKey } from "./reconcile-by-key";

type OptimisticAction<TDocument> = {
  id: string;
  document: TDocument;
};

export function createReconcileOptimistic<TItem, TDocument>(
  documentId: string | undefined,
  pickNext: (action: OptimisticAction<TDocument>) => TItem[] | undefined,
) {
  return (
    current: TItem[] | undefined,
    action: OptimisticAction<TDocument>,
  ): TItem[] | undefined => {
    if (documentId && action.id !== documentId) return current;
    const next = pickNext(action);
    return Array.isArray(next) ? reconcileByKey(current, next) : current;
  };
}
