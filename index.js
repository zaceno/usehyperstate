import { useState, useRef, useMemo } from "react"

var shouldRestart = (a, b) => {
  for (var k in { ...a, ...b }) {
    if (typeof (Array.isArray(a[k]) ? a[k][0] : a[k]) === "function") {
      b[k] = a[k]
    } else if (a[k] !== b[k]) return true
  }
}

var patchSubs = (oldSubs, newSubs = [], dispatch) => {
  for (
    var subs = [], i = 0, oldSub, newSub;
    i < oldSubs.length || i < newSubs.length;
    i++
  ) {
    oldSub = oldSubs[i]
    newSub = newSubs[i]

    subs.push(
      newSub && newSub !== true
        ? !oldSub ||
          newSub[0] !== oldSub[0] ||
          shouldRestart(newSub[1], oldSub[1])
          ? [
              newSub[0],
              newSub[1],
              (oldSub && oldSub[2](), newSub[0](dispatch, newSub[1])),
            ]
          : oldSub
        : oldSub && oldSub[2]()
    )
  }
  return subs
}

var makeDispatch = ({
  subscriptions,
  dispatch = x => x,
  init,
  state,
  setState,
}) => {
  var subs = []

  var update = newState => {
    if (state.current !== newState) {
      state.current = newState
      setState(newState) //causes render
      if (subscriptions)
        subs = patchSubs(subs, subscriptions(state.current), dispatch)
    }
  }

  return (
    (dispatch = dispatch((action, props) =>
      typeof action === "function"
        ? dispatch(action(state.current, props))
        : Array.isArray(action)
        ? typeof action[0] === "function"
          ? dispatch(action[0], action[1])
          : action
              .slice(1)
              .map(
                fx => fx && fx !== true && (fx[0] || fx)(dispatch, fx[1]),
                update(action[0])
              )
        : update(action)
    ))(init),
    dispatch
  )
}

export default function (options) {
  let [_, setState] = useState(null)
  let state = useRef(null)
  const dispatch = useMemo(
    () => makeDispatch({ ...options, state, setState }),
    []
  )
  const handler = action => event => dispatch(action, event)
  return [state.current, handler]
}
