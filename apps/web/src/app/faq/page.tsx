import { AccordionRoot } from "~/components/accordion/accordion";
import { AccordionItem } from "~/components/accordion/accordion-item";
import { GoBack } from "~/components/buttons/go-back";

export default function FAQ() {
  return (
    <main className="bg-secondary-white py-4 md:py-6 ">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href="" usePrevRoute={true} text={`Back`} />
      </div>
      <section className="mx-auto flex w-full flex-col pt-4 md:max-w-[1360px] md:gap-4 md:px-6">
        <h1 className="pb-4 text-center text-2xl text-secondary-black md:pb-0 md:text-3xl">
          Help
        </h1>
        <h2 className="pb-4 text-center text-xl text-primary-gray md:pb-0 md:text-2xl">
          FAQs
        </h2>
        <section className="mx-auto flex w-full flex-col gap-4 md:max-w-[1174px]">
          <AccordionRoot defaultValue="item-1">
            <AccordionItem
              title="TODOTitle"
              content="TODOContent"
              value="item-1"
            />
          </AccordionRoot>
        </section>
      </section>
    </main>
  );
}
