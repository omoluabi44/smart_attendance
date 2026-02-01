// app/Counter.js
'use client';

import { useAppDispatch, useAppSelector } from '@/app/lib/hooks';
import { increment, decrement } from '@/app/lib/counter/counterSlice';

export default function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const user = useAppSelector((state) => state.user.id);
  const dispatch = useAppDispatch();

  return (
    <div>
      <button onClick={() => dispatch(decrement())}>-</button>
      <span>{count}</span>
           <span>{user}</span>
      <button onClick={() => dispatch(increment())}>+</button>
    </div>
  );
}