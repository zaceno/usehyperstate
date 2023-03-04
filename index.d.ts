declare module "usehyperstate" {
  
  type MaybeEffect<S> =
    | boolean
    | 0
    | ""
    | null
    | Effecter<S, void>
    | [Effecter<S, any>, any]
  export type Action<S, X> = (
    s: S,
    x: X
  ) => S | [S, ...MaybeEffect<S>[]] | Action<S, void> | [Action<S, any>, any]
  export type Unsubscribe = () => void
  export type Subscriber<S, X = unknown> = (
    dispatch: Dispatch<S>,
    x: X
  ) => Unsubscribe
  export type Subscription<S, X = unknown> = [Subscriber<S, X>, X]
  export type MaybeSubscription<S> = Falsy | true | Subscription<S, any>
  export type Subscriptions<S> = (s: S) => MaybeSubscription<S>[]
  type ValidSubscription<X, S> = X extends readonly [Subscriber<S, any>, infer Y]
    ? readonly [Subscriber<S, Y>, Y]
    : Falsy | true
  
  type ValidSubscriptions<U, S> = U extends void
    ? void
    : U extends (s: S) => (infer U)[] //infer R
    ? (s: S) => ValidSubscription<U, S>[]
    : never
  
  type Falsy = 0 | "" | null | undefined | false
  type Effecter<S, X = unknown> = (
    dispatch: Dispatch<S>,
    x: X
  ) => void | Promise<void>
  
  type ValidMaybeEffect<S, M> = M extends readonly [Effecter<S, any>, infer X]
    ? readonly [Effecter<S, X>, X]
    : Falsy | true | Effecter<S, void>
  
  type ValidAction<A, S, X> = A extends (s: S, x: X) => infer R
    ? (s: S, x: X) => ValidActionReturn<R, S>
    : never
  
  type ValidActionReturn<A, S> = A extends readonly [
    (s: S, x: infer X) => infer R,
    any
  ]
    ? readonly [(s: S, x: X) => ValidActionReturn<R, S>, X]
    : A extends Function
    ? ValidAction<A, S, void>
    : A extends [S, ...(infer M)[]]
    ? readonly [S, ...ValidMaybeEffect<S, M>[]]
    : S
  
  type _Dispatch1<S> = <A, X>(action: A & ValidAction<A, S, X>, x: X) => void
  type _Dispatch2<S> = <A>(action: A & ValidActionReturn<A, S>, x: void) => void
  export type Dispatch<S> = _Dispatch1<S> & _Dispatch2<S>
  
  
  type ValidMiddleware<M, S> = M extends Function ? (d:Dispatch<S>)=>Dispatch<S> : undefined
  
  export type Handler<S> = <E>(action:Action<S, E>) => (event:E) => void 
  
  type ValidOptions<O, S> = O extends {
    init: infer I,
    subscriptions?: infer U,
    dispatch?: infer D,
  } ? {
    init: ValidActionReturn<I, S>,
    subscriptions?: ValidSubscriptions<U, S>,
    dispatch?: ValidMiddleware<D, S>
  } : never
  
  export default function <S, O>(options: O & ValidOptions<O, S>): [S, Handler<S>] 
}