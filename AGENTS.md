# Important

1. Keep the code dry. Functions should be re-used.
2. This project uses Prisma. We should use Prisma and avoid raw sql as much as possible.
3. Use type inference as much as possible. Do not construct new types when that type can be derived from Prisma.
4. Split components out into their own files.
5. Use bun instead of node or npm
6. Use react-router v7 constructs: typed routes, getting `loaderData` and `actionData` from `Route.ComponentProps`, etc
7. Never use `any`, and avoid using `as`
8. Split the code function based. don't repeat the code
9. Don't use the `type` keyword instead use the `interface`
10. Once the changes are completed always run `bun run typecheck` to ensure there are no type errors.



# Typescript
* Always use strict equality: `===` or `!==`.

* One function or type per file.
  When a file imports something from another file, the entire file and all of its dependencies are also loaded. This can lead to unnecessary bloat at runtime. Limiting files to one construct aids in readability and unit-testability.
* Create Pure Functions.
  Pure functions are functions that always produce the same output for the same input and have no observable side effects. As you’re writing code, identify code blocks that are pure and split them out into their own function/file. This aids readability and unit-testability.

  
* Do not use `Array.forEach`.
  This method was useful in the early days for iterating over an array, but modern TypeScript supports this natively. `for (const item of items)` is much easier to read.
* Dates suck; use a helper library.
  JavaScript’s `Date` object was based of Java 1.0’s Date object. It’s terrible. Always use `date-fns` or `dayjs`. Temporal has been proposed as a native type (see <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal>).
* Use `Decimal.js` for math operations.
  `Number` uses floating point precision, which causes unexpected behavior: `0.1+0.2 = 0.30000000000000004`. Decimal has been proposed as a native type (see <https://github.com/tc39/proposal-decimal>).
* `try/catch` is a code-smell.
  While its tempting to use `try/catch` to prevent problems, it should only be used when you want to alter the flow of business logic using data from the error.
* Always log the error.
  If you log only `error.message` then very useful data about the error will be lost.
* Prefer logging and returning over throwing an error.
  This aids testability and is more performant. Throwing an error should only be done when the code path can absolutely not be continued.
* When throwing an error, use static messages and specify the `cause`.
  Static messages make error aggregation and analysis much easier. The `Error` constructor supports passing additional data in second parameter: `throw new Error('Something went wrong', { cause: { customerId: 1 } });`


* Prefer type inference.
  For example, if you want to map an array of strings, you should not specify the type on the `.map(…)` argument.
  
  ✅ `arrayOfStrings.map(x => x.substring(0, 1))`
  ❌ `arrayOfStrings.map((x: string) => x.substring(0, 1))`
  
  This helps readability and refactorability.
* 

Remember, TypeScript is just JavaScript. Be aware of pitfalls: <https://github.com/denysdovhan/wtfjs>