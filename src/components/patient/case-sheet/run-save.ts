/**
 * Runs a case-sheet save operation and reports only whether it succeeded.
 *
 * Every mutation used by the case-sheet goes through `useMutationOperation`,
 * which already shows the error toast, so callers only need to know whether to
 * reset their local draft state. Without this wrapper a failed `mutateAsync`
 * would surface as an unhandled promise rejection in the browser console.
 */
export async function runSave(operation: () => Promise<unknown>): Promise<boolean> {
  try {
    await operation();
    return true;
  } catch {
    return false;
  }
}
