// 'use client'
// import { useRef } from 'react'
// import { Provider } from 'react-redux'
// import { makeStore } from '@/app/lib/store'

// export default function StoreProvider({ children }) {
//   const storeRef = useRef(undefined)
//   if (!storeRef.current) {
//     // Create the store instance the first time this renders
//     storeRef.current = makeStore()
//   }

//   return <Provider store={storeRef.current}>{children}</Provider>
// }


// app/StoreProvider.jsx
// 'use client'
// import { useRef } from 'react'
// import { Provider } from 'react-redux'
// import { makeStore } from '@/app/lib/store'
// import { login } from '@/app/lib/features/user/userStore' // use your login action

// export default function StoreProvider({ initialUser, children }) {
//   const storeRef = useRef(null)

//   if (!storeRef.current) {
//     storeRef.current = makeStore()

//     // Initialize user data if provided
//     if (initialUser?.id) {
//       storeRef.current.dispatch(login(initialUser.id))
//     }
//   }

//   return <Provider store={storeRef.current}>{children}</Provider>
// }

// app/StoreProvider.jsx
'use client'

import { useRef } from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore } from '@/app/lib/store'
import { login } from '@/app/lib/features/user/userStore' // use your login action

export default function StoreProvider({ initialUser, children }) {
  const storeAndPersistorRef = useRef(null)

  if (!storeAndPersistorRef.current) {
    storeAndPersistorRef.current = makeStore()

    // Initialize user data if provided
    if (initialUser?.id) {
      storeAndPersistorRef.current.store.dispatch(login(initialUser.id))
    }
  }

  const { store, persistor } = storeAndPersistorRef.current;

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  )
}
