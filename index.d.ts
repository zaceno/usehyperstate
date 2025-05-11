declare module "usehyperstate" {
  type StateType = boolean | number | string | Record<keyof any, unknown>

  export type Effecter<X = void> = (
    dispatch: Dispatch,
    options: X,
  ) => void | Promise<void>

  export type Action<S extends StateType, P = void> = (
    state: S,
    payload: P,
  ) => Dispatchable<S>

  type Dispatchable<S extends StateType> =
    | S
    | [S, ...(false | 0 | "" | null | Effecter<void> | [Effecter<any>, any])[]]
    | Action<S, void>
    | [Action<S, any>, any]

  export type Dispatch = (<S extends StateType>(
    action: Dispatchable<S>,
  ) => void) &
    (<S extends StateType, X>(action: Action<S, X>, payload: X) => void)

  type Subscriber<X extends Record<string, any>> = (
    dispatch: Dispatch,
    options: X,
  ) => () => void

  type Handler<S extends StateType> = (
    action: Dispatchable<S>,
  ) => <E>(event: E) => void

  type Options<S extends StateType> = {
    init: Dispatchable<S>
    subscriptions?: (
      state: S,
    ) => (false | 0 | "" | null | readonly [Subscriber<any>, any])[]
    dispatch?: (dispatch: Dispatch) => Dispatch
  }

  export default function <S extends StateType>(o: Options<S>): [S, Handler<S>]
}
