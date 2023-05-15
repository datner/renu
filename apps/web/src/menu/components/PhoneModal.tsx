import { Dialog, Transition } from "@headlessui/react";
import { useLocalStorage } from "@mantine/hooks";
import { useTranslations } from "next-intl";
import { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

export function FeedbackModal() {
  const [show, setShow] = useState(false);
  const t = useTranslations("menu.Components.PhoneModal");
  const [phone, setPhoneNumber] = useLocalStorage({ key: "phone-number" });
  const form = useForm({
    defaultValues: { phone },
    mode: "all",
    delayError: 800,
  });
  const onSubmit = form.handleSubmit(({ phone }) => {
    setPhoneNumber(phone);
    setShow(false);
  });
  const { reset, trigger } = form;

  useEffect(() => {
    reset({ phone });
    const timoutId = setTimeout(async () => {
      const valid = await trigger("phone");
      if (!valid) {
        setShow(true);
      }
    }, 1_000);
    return () => clearTimeout(timoutId);
  }, [phone, reset, trigger]);

  return (
    <>
      <Transition appear show={show} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => null}>
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
                <Dialog.Panel
                  as="form"
                  onSubmit={onSubmit}
                  className="w-full z-10 max-w-md transform overflow-hidden rounded-2xl bg-white p-6 rtl:text-right align-middle shadow-xl transition-all"
                >
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {t("title")}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {t("please give phone number")}
                    </p>
                  </div>
                  <div className="mt-2 form-control">
                    <label className="label">
                      <span role="alert" className="label-text">{t("phone label")}</span>
                    </label>
                    <input
                      {...form.register("phone", {
                        required: t("required"),
                        pattern: {
                          message: t("pattern"),
                          value: PHONE_REGEX,
                        },
                        maxLength: {
                          message: t("maxLength"),
                          value: 10,
                        },
                      })}
                      aria-invalid={Boolean(form.formState.errors.phone)}
                      type="tel"
                      placeholder="050-0000-000"
                      className="input input-bordered aria-[invalid=true]:input-error input-md w-full input-primary"
                    />
                    <label className="label">
                      <span role="alert" className="label-text-alt text-error">
                        {form.formState.errors.phone?.message}
                      </span>
                    </label>
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                    >
                      All done!
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
