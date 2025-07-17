import { GoBack } from "~/components/buttons/go-back";
import { BlurImage } from "~/components/images/blur-image";
import genericPageImage from "../../../public/placeholders/generic-page.png";

export default function AboutUs() {
  return (
    <main className="bg-secondary-white py-4 md:py-6 ">
      <div className="mx-auto flex items-center justify-between px-4 md:max-w-[1360px] md:px-6">
        <GoBack href="" usePrevRoute={true} text={`Back`} />
      </div>
      <section className="mx-auto flex w-full flex-col pt-4 md:max-w-[1360px] md:gap-4 md:px-6">
        <h1 className="pb-4 text-center text-2xl text-secondary-black md:pb-0 md:text-3xl">
          About Us
        </h1>

        <BlurImage
          src={genericPageImage.src}
          alt="Auction Placeholder"
          width={1360}
          height={600}
          className="md:w-[960]px md:h-[600]px h-[250]px w-full object-cover md:rounded-xl"
          unoptimized
        />
        <section className="mx-auto flex w-full flex-col gap-4 bg-white p-4 md:max-w-[1174px] md:rounded-xl md:px-6">
          <h2 className="text-lg text-secondary-black md:text-2xl">
            This is an example of an in-page title
          </h2>
          <p className="text-[0.875rem] font-light text-primary-gray md:text-[1rem]">
            Adipiscing veniam, ad consequat. illum praesent delenit commodo nisl
            feugiat Duis dolor nulla velit esse aliquip qui accumsan elit,
            blandit eros iriure nulla facilisis dolore dignissim at vel
            consequat, ex in ullamcorper sed autem magna amet, consectetuer
            euismod Ut luptatum nonummy vero et vel et feugait zzril augue
            dolore wisi quis nibh ea diam enim ipsum ut aliquam odio minim erat
            dolor facilisi. nostrud Lorem tincidunt volutpat. tation iusto
            laoreet suscipit sit eu vulputate hendrerit eum ut te dolore
            lobortis molestie in exerci duis
          </p>
          <p className="text-[0.875rem] font-light text-primary-gray md:text-[1rem]">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
            nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat
            volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation
            ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo
            consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate
            velit esse molestie consequat, vel illum dolore eu feugiat nulla
            facilisis at vero eros et accumsan et iusto odio dignissim qui
            blandit praesent luptatum zzril delenit augue duis dolore te feugait
            nulla facilisi.
          </p>
          <p className="text-[0.875rem] font-light text-primary-gray md:text-[1rem]">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam
            nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat
            volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci
          </p>
          <h2 className="text-lg text-secondary-black md:text-2xl">
            This is an example of an in-page title
          </h2>
          <h3 className="text-lg text-secondary-black md:text-xl">
            This is an example of an in-page sub-title
          </h3>
          <p className="text-[0.875rem] font-light text-primary-gray md:text-[1rem]">
            Adipiscing veniam, ad consequat. illum praesent delenit commodo nisl
            feugiat Duis dolor nulla velit esse aliquip qui accumsan elit,
            blandit eros iriure nulla facilisis dolore dignissim at vel
            consequat, ex in ullamcorper sed autem magna amet, consectetuer
            euismod Ut luptatum nonummy vero et vel et feugait zzril augue
            dolore wisi quis nibh ea diam enim ipsum ut aliquam odio minim erat
            dolor facilisi. nostrud Lorem tincidunt volutpat. tation iusto
            laoreet suscipit sit eu vulputate hendrerit eum ut te dolore
            lobortis molestie in exerci duis
          </p>
          <ul className="list-disc pl-6 text-[0.875rem] font-light text-primary-gray md:text-[1rem]">
            <li>Delenit dolore nostrud ut ea</li>
            <li>
              Dolor vero odio facilisi nonummy iusto praesent magna eum vel enim
              minim at molestie exerci nulla quis qui dignissim nulla
            </li>
            <li>Lorem tincidunt volutpat</li>
            <li>
              Consectetuer euismod Ut luptatum nonummy vero et vel et feugait
              zzril
            </li>
          </ul>
          <h3 className="text-lg text-secondary-black md:text-xl">
            This is an example of an in-page sub-title
          </h3>
          <p className="text-[0.875rem] font-light text-primary-gray md:text-[1rem]">
            Adipiscing veniam, ad consequat. illum praesent delenit commodo nisl
            feugiat Duis dolor nulla velit esse aliquip qui accumsan elit,
            blandit eros iriure nulla facilisis dolore dignissim at vel
            consequat, ex in ullamcorper sed autem magna amet, consectetuer
            euismod Ut luptatum nonummy vero et vel et feugait zzril augue
            dolore wisi quis nibh ea diam enim ipsum ut aliquam odio minim erat
            dolor facilisi. nostrud Lorem tincidunt volutpat. tation iusto
            laoreet suscipit sit eu vulputate hendrerit eum ut te dolore
            lobortis molestie in exerci duis
          </p>
        </section>
      </section>
    </main>
  );
}
