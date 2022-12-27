import Image from "next/image"
import { useMutation } from "@blitzjs/rpc"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import { CreateRestaurant } from "src/auth/validations"
import { useZodForm } from "src/core/hooks/useZodForm"
import { FormProvider } from "react-hook-form"
import createRestaurant from "src/restaurants/mutations/createRestaurant"
import { useDropzone } from "react-dropzone"
import { useEvent } from "src/core/hooks/useEvent"
import { useState } from "react"
import getUploadUrl from "src/admin/mutations/getUploadUrl"

type SignupFormProps = {
  onSuccess?: () => void
}

export const RestaurantForm = (props: SignupFormProps) => {
  const { onSuccess } = props
  const [getAssetUrl] = useMutation(getUploadUrl)
  const [restaurantMutation] = useMutation(createRestaurant)
  const [file, setFile] = useState<(File & { preview: string }) | undefined>()

  const form = useZodForm({
    schema: CreateRestaurant.omit({ logo: true }),
    defaultValues: {
      slug: "",
      en: {
        name: "",
      },
      he: {
        name: "",
      },
    },
  })

  const { formState, handleSubmit, setFormError } = form
  const { isSubmitting } = formState

  const onDrop = useEvent((acceptedFiles: File[]) => {
    const [file] = acceptedFiles
    if (!file) return
    setFile(Object.assign(file, { preview: URL.createObjectURL(file) }))
  })

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  })

  const onSubmit = handleSubmit(async (data) => {
    if (!file) return
    try {
      const { url, headers: h } = await getAssetUrl({
        name: `${data.slug}/logo.${file.name.split(".").pop()}`,
        restaurant: data.slug,
      })
      const headers = new Headers(h)
      headers.append("Content-Length", `${file.size + 5000}`)

      const {
        data: {
          attributes: { origin_path },
        },
      } = await fetch(url, {
        method: "POST",
        headers,
        body: await file.arrayBuffer(),
      }).then((res) => res.json())

      await restaurantMutation({
        ...data,
        logo: origin_path,
        affiliate: true,
      })

      onSuccess?.()
    } catch (error: any) {
      setFormError(error.toString())
    }
  })

  return (
    <FormProvider {...form}>
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="pb-4">
          <h1 className="text-xl text-gray-700 font-semibold underline underline-offset-1 decoration-indigo-600">
            Create a Restaurant
          </h1>
        </div>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="flex gap-4">
            <fieldset className="space-y-6 flex-1" disabled={isSubmitting}>
              <LabeledTextField name="slug" label="Slug" placeholder="my-restaurant" />
              <LabeledTextField name="en.name" label="English Name" placeholder="My Restaurant" />
              <LabeledTextField name="he.name" label="Hebrew Name" placeholder="המסעדה שלי" />
            </fieldset>
            <div className="flex-1 flex flex-col">
              <span className="block text-sm font-medium text-gray-700">Logo</span>
              <div
                {...getRootProps()}
                className="p-2 mt-1 rounded-md cursor-pointer border border-gray-300 bg-gray-100 border-dashed"
              >
                <input {...getInputProps()} />
                <span className="text-gray-400 text-sm">
                  {isDragActive ? (
                    <p>Drop the files here ...</p>
                  ) : (
                    <p>Drag n drop some files here, or click to select files</p>
                  )}
                </span>
              </div>

              {file && (
                <div className="mt-2 relative grow">
                  <Image
                    className="object-cover"
                    unoptimized
                    fill
                    alt="preview"
                    src={file.preview}
                    sizes="100vw"
                  />
                </div>
              )}
            </div>
          </div>
          <button
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            type="submit"
            disabled={isSubmitting}
          >
            Create restaurant
          </button>
        </form>
      </div>
    </FormProvider>
  )
}

export default RestaurantForm
