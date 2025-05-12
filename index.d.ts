// Minimum TypeScript Version: 4.2

declare module "usehyperstate" {
  // A Hyperapp instance typically has an initial state and a top-level view
  // mounted over an available DOM element.
  type Options<S> = {
    // State is established through either direct assignment or an action.
    init: Dispatchable<S>

    // The subscriptions function manages a set of subscriptions.
    subscriptions?: (
      state: S,
    ) => readonly (boolean | undefined | Subscription<S>)[]

    // Dispatching can be augmented to do custom processing.
    dispatch?: (dispatch: Dispatch<S>) => Dispatch<S>
  }

  type Handler<S> = (action: Dispatchable<S>) => <E>(event: E) => void

  export default function <S>(options: Options<S>): [S, Handler<S>]

  // ---------------------------------------------------------------------------

  // An action transforms existing state and/or wraps another action.
  type Action<S, P = any> = (state: S, payload: P) => Dispatchable<S>

  // Dispatching will cause state transitions.
  type Dispatch<S> = (dispatchable: Dispatchable<S>, payload?: unknown) => void

  // A dispatchable entity is used to cause a state transition.
  type Dispatchable<S, P = any> =
    | S
    | [state: S, ...effects: MaybeEffect<S, P>[]]
    | Action<S, P>
    | readonly [action: Action<S, P>, payload: P]

  // An effecter is the function that runs an effect.
  type Effecter<S, P = any> = (
    dispatch: Dispatch<S>,
    payload: P,
  ) => void | Promise<void>

  // An effect is where side effects and any additional dispatching may occur.
  type Effect<S, P = any> =
    | Effecter<S, P>
    | readonly [effecter: Effecter<S, P>, payload: P]

  // Effects can be declared conditionally.
  type MaybeEffect<S, P> = null | undefined | boolean | "" | 0 | Effect<S, P>

  // A subscription reacts to external activity.
  type Subscription<S, P = any> = readonly [
    subscriber: (dispatch: Dispatch<S>, payload: P) => Unsubscribe,
    payload: P,
  ]

  // An unsubscribe function cleans up a canceled subscription.
  type Unsubscribe = () => void
}
