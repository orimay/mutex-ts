### mutex-ts

This package provides two classes for managing locks in asynchronous (and
multi-threaded-like) environments: `Mutex` and `MutexRW`. Use these locks to
protect critical sections in your code, ensuring that only one task (or a
controlled number of tasks) can access a shared resource at a time.

> **Note:** The `lock()`, `lockRO()`, and `lockRW()` methods return objects that
> implement a disposable interface via the `[Symbol.dispose]` property. This
> allows you to use the upcoming `using` statement to automatically release
> locks at the end of a scope.

#### Installation

To install the package, you can use npm, yarn or pnpm:

```bash
npm install mutex-ts
# or
yarn add mutex-ts
# or
pnpm add mutex-ts
```

#### Usage

1. **Mutex:**

   The `Mutex` class provides a simple mutual exclusion lock.

   ##### Manual Lock Management

   You can manually acquire and release the lock with obtain():

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

   ##### Using Disposable Locks with `using`

   Alternatively, use the new `lock()` method to obtain a disposable lock object
   that automatically releases the lock when the scope ends. (This works in
   TypeScript with the upcoming `using` syntax.)

   ```typescript
   import { Mutex } from 'mutex-ts';

   async function criticalSectionUsing() {
     const mutex = new Mutex();
     // Using the "using" pattern (requires proper TS configuration/polyfill)
     {
       using _ = await mutex.lock();
       // Critical section code goes here.
       // When the block exits, _[Symbol.dispose]() is called, releasing the lock.
     }
   }
   ```

2. **MutexRW:**

   The `MutexRW` class provides a more complex lock supporting multiple readers
   and a single writer.

   ##### Manual Lock Management

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

   ##### Using Disposable Locks with `using`

   Alternatively, use the new `lockRO()` and `lockRW()` methods to obtain a
   disposable lock object that automatically releases the lock when the scope
   ends. (This works in TypeScript with the upcoming `using` syntax.)

   ```typescript
   import { MutexRW } from 'mutex-ts';

   const mutexRW = new MutexRW();

   {
     // Obtain a read lock
     using _ = await mutexRW.obtainRO();

     // Automatic release of the read lock in the end of the block
   }

   {
     // Obtain a write lock
     using _ = await mutexRW.obtainRW();

     // Automatic release of the write lock in the end of the block
   }
   ```

#### Important Notes

- **Automatic Disposal**: The objects returned by `lock()`, `lockRO()`, and
  `lockRW()` have a `[Symbol.dispose]` property. When used with the upcoming
  using syntax, the corresponding lock is automatically released when the
  variable goes out of scope.
- **Bypass Option**: Passing true to `obtain()` skips waiting for the lock,
  returning a release function (or no-op, if lock is not acquired). This can be
  useful when you want to conditionally enter a critical section.
- **Integration**: Ensure your TypeScript configuration (or polyfill) supports
  the `using` syntax and the disposable feature (i.e. having the correct `"lib"`
  settings such as including `"esnext"` or `"esnext.disposable"`).
- If you are using manual lock management, please make sure to handle lock
  release in a `finally` block as shown in the examples to ensure proper
  synchronization and resource cleanup.

For further details, you can refer to the source code and comments within the
package.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## Authors

- Dmitrii Baranov <dmitrii.a.baranov@gmail.com>
