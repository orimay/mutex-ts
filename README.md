### mutex-ts

This package provides two classes for managing locks: `Mutex` and `MutexRW`.
These locks can be used to control access to critical sections in a
multi-threaded or asynchronous environment.

#### Installation

To install the package, you can use npm or yarn:

```bash
npm install mutex-ts
# or
yarn add mutex-ts
```

#### Usage

1. **Mutex:**

   The `Mutex` class provides a simple mutual exclusion lock.

   ```typescript
   import { Mutex } from 'mutex-ts';

   const mutex = new Mutex();

   // Obtain the lock
   const release = await mutex.obtain();

   try {
     // Your critical section code here
   } finally {
     // Release the lock in a finally block
     release();
   }
   ```

   By using a `try...finally` block, you ensure that the lock is always
   released, even if an error occurs within the critical section.

   You can also use the `bypass` parameter to conditionally obtain a lock
   without waiting, which can be useful when you need to skip the lock within an
   already locked context determined at runtime:

   ```typescript
   // Conditionally obtain the lock with bypass (non-blocking)
   const shouldBypass = someCondition(); // Determine at runtime
   const release = await mutex.obtain(shouldBypass);

   try {
     // Your critical section code here
   } finally {
     // Release the lock in a finally block
     release();
   }
   ```

   This allows you to make the decision to bypass the lock based on a runtime
   condition, ensuring flexibility in your locking strategy.

2. **MutexRW:**

   The `MutexRW` class provides a more complex lock supporting multiple readers
   and a single writer.

   ```typescript
   import { MutexRW } from 'mutex-ts';

   const mutexRW = new MutexRW();

   // Obtain a read lock
   const releaseRO = await mutexRW.obtainRO();

   try {
     // Your read operation here
   } finally {
     // Release the read lock in a finally block
     releaseRO();
   }

   // Obtain a write lock
   const releaseRW = await mutexRW.obtainRW();

   try {
     // Your write operation here
   } finally {
     // Release the write lock in a finally block
     releaseRW();
   }
   ```

   Readers can obtain read locks simultaneously, but writers must wait until all
   readers release their locks. Using `try...finally` blocks ensures that locks
   are correctly released, preventing deadlocks or other synchronization issues.

#### Important Note

Please make sure to handle lock release in a `finally` block as shown in the
examples to ensure proper synchronization and resource cleanup. When using the
`bypass` parameter, the decision to bypass the lock should be determined at
runtime based on your application's logic.

For further details, you can refer to the source code and comments within the
package.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Authors

- Dmitrii Baranov <dmitrii.a.baranov@gmail.com>
