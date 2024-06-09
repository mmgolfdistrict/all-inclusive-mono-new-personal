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
        <h3 className="pb-4 text-left text-xl text-primary-gray md:pb-0 md:text-2xl">
          General Questions
        </h3>
        <section className="mx-auto flex w-full flex-col gap-4 md:max-w-[1174px]">
          <AccordionRoot defaultValue="item-1">
            <AccordionItem title="What is Golf District?" value="item-1">
              Golf District is the world&apos;s first marketplace to buy and
              sell tee times. This revolutionary technology allows you the
              comfort to book tee times in advance with the convenience of
              reselling them if your plans change.
            </AccordionItem>
            <AccordionItem
              title="How does Golf District's secondary marketplace work?"
              value="item-2"
            >
              Please refer to our <a href="/how-to-guide">How to Guide</a> for
              detailed instructions. For further questions or feedback, email us
              at{" "}
              <a href="mailto:support@golfdistrict.com">
                support@golfdistrict.com
              </a>
              . We&apos;d love to hear from you.
            </AccordionItem>
            <AccordionItem
              title="How much does it cost to use Golf District?"
              value="item-3"
            >
              <ul>
                <li>
                  Searching for tee times, creating an account, and sharing tee
                  times with friends are free.
                </li>
                <li>Listing a tee time is free if your plans change.</li>
                <li>
                  When a tee time is sold, both the buyer and seller pay a small
                  transaction fee, which is split between the golf course and
                  Golf District to continue adding value to all golfers.
                </li>
              </ul>
            </AccordionItem>
          </AccordionRoot>
        </section>

        <h3 className="pb-4 text-left text-xl text-primary-gray md:pb-0 md:text-2xl">
          Booking and Selling
        </h3>
        <section className="mx-auto flex w-full flex-col gap-4 md:max-w-[1174px]">
          <AccordionRoot defaultValue="item-2">
            <AccordionItem title="Can I cancel a purchase?" value="item-4">
              No, all purchases are final to protect users and maintain market
              integrity. However, you can sell your unwanted tee time to other
              golfers by clicking the “Sell” box at the top of the page. Add
              Sensible Weather at checkout for rain protection.
            </AccordionItem>
            <AccordionItem
              title="What do I do if there is a weather delay or cancellation?"
              value="item-5"
            >
              Golf District partners with Sensible Weather to offer tee time
              protection. If excessive rain affects your outing, you’ll be
              refunded, even if you choose to play. Add Sensible Weather
              protection at checkout. For more details, see the{" "}
              <a href="/how-to-guide">How to Guide</a>.
            </AccordionItem>
            <AccordionItem
              title="Can I modify the time or date of my tee-time reservation?"
              value="item-6"
            >
              All tee-time purchases are final. However, if plans change, you
              can sell your tee time on the marketplace. Click the “Sell Your
              Tee Time” link at the top of the page to list your tee time for
              other users to see.
            </AccordionItem>
            <AccordionItem
              title="Can I add or edit the players on my reservation?"
              value="item-7"
            >
              You can adjust guest names at checkout or afterward. To add a
              player, you will need to find the desired time and see if
              it&apos;s still available or if another golfer is listing the
              time.
            </AccordionItem>
            <AccordionItem title="How do I sell my tee time?" value="item-8">
              Click &quot;Sell&quot; at the top of the page. For more details,
              see the <a href="/how-to-guide">How to Guide</a>.
            </AccordionItem>
          </AccordionRoot>
        </section>

        <h3 className="pb-4 text-left text-xl text-primary-gray md:pb-0 md:text-2xl">
          Account Security and Privacy
        </h3>
        <section className="mx-auto flex w-full flex-col gap-4 md:max-w-[1174px]">
          <AccordionRoot defaultValue="item-3">
            <AccordionItem
              title="How can I keep my Golf District account secure?"
              value="item-9"
            >
              <ul>
                <li>Do not share your login information.</li>
                <li>Use a unique, strong password.</li>
                <li>
                  Ensure Golf District emails come from a golfdistrict.com
                  address. Be cautious of phishing emails.
                </li>
                <li>
                  All payments are processed through secure third-party payment
                  processors that comply with PCI standards.
                </li>
              </ul>
            </AccordionItem>
            <AccordionItem
              title="How can I manage my privacy settings for my Golf District profile?"
              value="item-10"
            >
              Go to your account settings by selecting your profile icon at the
              top right of the page. Here, you can manage your privacy settings.
              By default, all accounts are private and only the username is
              visible to other users.
            </AccordionItem>
          </AccordionRoot>
        </section>
      </section>
    </main>
  );
}
