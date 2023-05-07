import { Dialog, Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

interface Props {
  readonly show: boolean;
  readonly onClose: () => void;
}

export function ErrorModal(props: Props) {
  const { show, onClose } = props;
  const t = useTranslations("menu.Components.ErrorModal");
  return (
    <>
      <Transition appear show={show} as={Fragment}>
        <Dialog as="div" className="relative z-50 " onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full z-10 max-w-md transform overflow-hidden rounded-2xl bg-white p-6 rtl:text-right align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {t("title")} ☹️
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{t("sorry please try again")} 💚</p>
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="btn btn-primary w-full"
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      {t("refresh")}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
