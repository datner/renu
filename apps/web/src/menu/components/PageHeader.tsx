import { ChevronUpIcon } from "@heroicons/react/20/solid";
import { Option, ReadonlyArray, String } from "effect";
import Image from "next/image";
import { useLocale } from "src/core/hooks/useLocale";
import { useVenue } from "../hooks/useVenue";

export const PageHeader = () => {
  const venue = useVenue();
  const locale = useLocale();
  const content = venue.content.find(_ => _.locale === locale);
  if (!content || venue.logo === "") {
    return null;
  }
  const scrollToTop = () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  };
  return (
    <>
      <div className="h-14 text-lg sticky top-0 z-10 -mt-14 bg-white shadow flex items-center px-2 font-bold">
        <div className="grow">{content.name}</div>
        <button onClick={scrollToTop} className="btn btn-circle btn-sm">
          <ChevronUpIcon className="size-5" />
        </button>
      </div>
      <div className="hero bg-gradient-to-b z-10 from-emerald-300 to-emerald-100">
        <div className="hero-content text-center bg-white rounded my-8">
          <div className="max-w-md">
            <div className="p-2 pt-0">
              <div className="relative h-48 w-48">
                <Image
                  priority
                  className="object-cover"
                  fill
                  src={`${venue.logo}?cs=strip`}
                  quality={75}
                  alt={venue.identifier}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold">{content.name}</h1>
            {venue.simpleContactInfo.pipe(
              Option.map(String.split("-")),
              Option.map(ReadonlyArray.headNonEmpty),
              Option.map(String.trim),
              Option.map(addr => <p className="text-gray-700">{addr}</p>),
              Option.getOrNull,
            )}
          </div>
        </div>
      </div>
    </>
  );
};
