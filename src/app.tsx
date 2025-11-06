import { Suspense, type Component } from 'solid-js';

const App: Component<{ children: Element }> = (props) => {
  return (
    <>
      <main class="bg-[#0f0f23] min-h-screen">
        <Suspense>{props.children}</Suspense>
      </main>
    </>
  );
};

export default App;
