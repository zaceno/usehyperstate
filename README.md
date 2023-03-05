# useHyperState

React custom hook for state management a-la Hyperapp.

## Quick Example

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import useHyperState from 'usehyperstate'

const Increment = x => x + 1
const Decrement = x => x - 1

function App(props) {
  const [state, _] = useHyperState({init: 0})
  return (
    <main>
      <h1>{state}</h1>
      <button onClick={_(Decrement)}>-</button>
      <button onClick={_(Increment)}>+</button>
    </main>
  )
}

ReactDOM.createRoot( 
  document.querySelector('#root')
).render(<App />)
```
#### A more in depth example

You're welcome to study this [code sandbox](https://codesandbox.io/s/demo-usehyperstate-5scxov?file=/src/SubApp.js) where the same app has
been implemented in four different ways, to illustrate the benefits over useReducer.

1. `PlainApp.js` - the app implemented with `useState` and `useEffect`
2. `ReducerApp.js` - the app implemented with `useReducer` (but still needs `useEffect` also)
3. `HyperApp.js` - illustrates replacing `useReducer` with `useHyperState`
4. `SubApp.js` - like 3, but leverages the subscriptions feature for an even more elegant implementation.


## Introduction

This custom hook brings [Hyperapp](https://hyperapp.dev)-style state management to React.
It is particularly useful if your state is complicated enough that you're already
using `useReducer` or redux, but you find it cumbersome to manage state-transitions with
assocated side effects.

And if you already know and love Hyperapp, this hook will allow you to reuse all your
actions, effects and subscriptions for hyperapp in react. They should be 100% compatible
since I actually copied the relevant parts of hyperapp's code verbatim over (There may
be some edge-case issues with React's synthetic events I don't know about)

## Basic usage

`useHyperState({init: initializer })` takes a configuration object as its only argument. The only
required property of the configuration object is `init:`. `init:` should be either:

- The initial state (which should not be an array, but can be an object, string or number)
- `[initialState, ...effects[]]` in order to run some effects immediately on initialization
- An _Action_, or a _Bound action_, which should not depend on the current state since there is no current state at this point

`useHyperState(...)` returns a tuple of `[currentState, makeHandler]` for use in the JSX of your component.

`makeHandler` (which I typically name as simply `_` creates an event handler from an Action or Bound Action. E.g:

```jsx
<button onClick={_(SomeAction)}>Click me</button>
```

So that when the event occurs, the given action will be dispatched, with the event object as payload.


## State management with `useHyperState`


### Actions

If you already know `useReducer` or redux, you already understand the basic pattern. However, unlike with those tools,
there is no "reducer". Or rather, each action is it's own reducer. An Action is a function which takes
the current state, and returns a new state. 

```js
const ToggleHints = state => ({...state, showHints: !state.showHints})
```

When an action is dispatched, the new state will be calculated based on the current state, which will cause a rerender with
the new state as current.

An action may take a second argument (often called the "payload"). When actions are dispatched from events in the DOM, the
payload will be the event object.

```jsx
const SetName = (state, event) => ({...state, name: event.target.value})
...
<input type="text" value={state.name} onInput={_(SetName)} />
```

But actions can also be dispatched as "Bound Actions" - an action-payload-tuple where the given payload overrides the
default.

```jsx
const IncrementFooBy = (state, amount) => ({...state, foo: state.foo + amount})
...
<button onClick={_([IncrementFooBy, 3])}>Foo + 3</button>
```

Instead of returning a state, an action may return another action, or bound action, which will be dispatched instead. 
This allows for some convenient "switching actions":

```js
const HandleKeypress = (state, ev) => 
    ev.key === 'ArrowUp'    ? MoveUp
  : ev.key === 'ArrowDown'  ? MoveDown
  : ev.key === 'ArrowLeft'  ? MoveLeft
  : ev.key === 'ArrowRight' ? MoveRight
  : state // returning state is effectively a no-op
```


### Effects 

Actions should be pure, i e they should be pure calculations without causing any side effects. They should not "do" anything. 
So anything you might wnat to _do_ in relation to state changes should be encapsulated in its own function.

```js
const jumpScareEffect = () => { alert('Boo!') }
```

Instead of returning the new state, or returning an action, an action may return an array where the new state is the first item, and the rest
are effects. 

```js
const ScaryToggle = (state) => [
  {...state, fear: !state.fear},
  jumpScareEffect
]
```
This will cause the effect to run after the state has been updated (but before a new render).


Most often you want reusable effects, so they can take parameters (as second argument). In that case, an effect can be given
as a function-payload-tuple:

```js
const alert = (_, message) => {alert(message)}
const ScaryToggle = (state) => [
  {...state, fear: !state.fear},
  [alert, 'Boo!']
]
```

> falsy values are treated as no-op effects, so that you can use logical expressions in your actions to conveniently decide wether or not
to run an effect.

Some effects need to "call back" when they are done, such as when you are fetching something from a server. For this reason, effects are
called with a `dispatch` function as the first argument. `dispatch` is used to dispatch actions.

```js
const getJSON = (dispatch, opts) => fetch(opts.url)
  .then(response => response.json())
  .then(data => dispatch(opts.OnResponse, data)

const FetchData = state => [
  {...state, fetching: true},
  [getJSON, {url: 'http://example.com/api/data', OnResponse: GotData}]
]

const GotData = (state, data) => ({
  ...state,
  fetching: false,
  data,
})
```

### Subscriptions

When there are things you want to "listen to" (window-events, setInterval, websockets et c), subscriptions are the thing to reach for. 

Effectively, a subscription is a function that sets up the listening part, and returns a function that stops the listening. Like effects,
subscriptions get a `dispatch` and options object as arguments, so they can call back when things happen.

```js
const onResize = (dispatch, opts) => {
  // set up listening:
  const handler = () => dispatch(opts.OnResize)
  window.addEventListener('resize', handler)
  return () => {
    //tear down listening:
    window.removeEventListener('resize', handler)
  }
}
```

So that's how you define a subscription - but how do you use it? You pass a `subscriptions:` property to the `useHyperState` config object.
The value of `subscriptions` should be a function which takes the current state as argument, and returns an array of all the subscriptions
should be live given the current state:

```js

const [state, _] = useHyperState({
  init: initialState,
  // typically you wouldn't inline the subscription function here
  // but have it defined outside the component definition
  // only shown here for illustrative purposes
  subscriptions: state => [
    [onResize, {OnResize: HandleResize}],
    state.timerRunning && [onInterval, {time: state.timerInterval, action: TimerTick}]
  ]
})

```

Each time the state is changed, this list is recalculated. The subscriptions which are no longer in the list are stopped. New subscriptions are started.
And any subscriptions whose options have changed are _restarted_ with the new options.

Notice how subscriptions are given as function-options-tuples, like effects. Also notice how we can conditionally activate
subscriptions based on state.

## More

The config object for `useHyperState` also supports "Augmented dispatching" ([see hyperapp docs](https://github.com/jorgebucaran/hyperapp/blob/main/docs/architecture/dispatch.md#augmented-dispatching)) 
through the `dispatch` property. It works the same way as in Hyperapp, and allows you to attach debug-tooling.

To gain a deeper understanding I recommend looking through the [Hyperapp docs](https://github.com/jorgebucaran/hyperapp/tree/main/docs), and in particular the [Hyperapp tutorial](https://github.com/jorgebucaran/hyperapp/blob/main/docs/tutorial.md) - just ignore anything
pertaining to the view. The rest is compatible.



