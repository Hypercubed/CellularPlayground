export interface CellState {
  state: string; // state name
  token: string; // token used for saving
  display?: string; // token for display
}

export function createState<T extends CellState = CellState>(
  state: string,
  token = state,
  display = token
): Readonly<T> {
  return Object.freeze({
    state,
    token: token[0], // ensure token is one character
    display,
  }) as T;
}
