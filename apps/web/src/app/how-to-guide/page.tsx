import { GoBack } from "~/components/buttons/go-back";

export default function HowToGuide() {
  return (
    <main className="bg-secondary-white py-4 md:py-6 ">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href="" usePrevRoute={true} text={`Back`} />
      </div>
      <section className="mx-auto flex w-full flex-col pt-4 md:max-w-[1360px] md:gap-4 md:px-6">
        <h1 className="pb-4 text-center text-2xl text-secondary-black md:pb-0 md:text-3xl">
          How to Guide
        </h1>
        <section className="mx-auto flex w-full flex-col gap-4 md:max-w-[1174px]">
          <iframe
            src="https://scribehow.com/page/Golf_District__How_to_Guide__Kg_zsvNST2C3xhJXdbeyog"
            title="Golf District How to Guide"
            style={{
              display: "block",
              height: "100vh",
              width: "100vw",
              border: "none",
            }}
          ></iframe>
        </section>
      </section>
    </main>
  );
}
