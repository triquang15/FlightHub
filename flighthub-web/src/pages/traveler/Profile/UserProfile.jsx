import React, { useState } from "react"
import { useSelector } from "react-redux"
import { Formik, Form, Field } from "formik"
import * as Yup from "yup"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { Mail, Phone, User, Pencil, Save, X, Lock } from "lucide-react"

// Profile validation
const profileSchema = Yup.object({
  fullName: Yup.string().required("Required").min(3, "Min 3 characters"),
  phone: Yup.string()
    .matches(/^\d{10,15}$/, "Invalid phone")
    .nullable(),
})

// Password validation
const passwordSchema = Yup.object({
  currentPassword: Yup.string().required("Required"),
  newPassword: Yup.string()
    .min(6, "Min 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, "Letters & numbers required")
    .required("Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Required"),
})

const UserProfile = () => {
  const { user } = useSelector((state) => state.auth)

  const [editMode, setEditMode] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  const getInitials = (name) => {
    if (!name) return "U"
    return name.split(" ").map(n => n[0]).join("").toUpperCase()
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    )
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleProfileSubmit = async (values) => {
    try {
      console.log("Update profile:", values)

      // TODO: call API
      // await api.put("/api/users/profile", values)

      setEditMode(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleChangePassword = async (values) => {
    try {
      setLoadingPassword(true)

      const payload = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }

      console.log("Change password:", payload)

      // TODO: call API
      // await api.post("/api/users/change-password", payload)

      setShowPasswordModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/40 to-background py-12 px-4">

      <div className="max-w-4xl mx-auto space-y-8">

        {/* HEADER */}
        <Card className="p-6 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center">

            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-28 w-28 ring-4 ring-background shadow-lg">
                <AvatarImage src={avatarPreview || user.profilePicture} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>

              <input
                type="file"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Info */}
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{user.fullName}</h1>
              <p className="text-muted-foreground">{user.email}</p>

              <div className="flex gap-2 mt-2 justify-center md:justify-start">
                <Badge>
                  {user.role?.replace("ROLE_", "").replace("_", " ")}
                </Badge>
                <Badge variant="outline">Active</Badge>
              </div>
            </div>

            {/* Edit */}
            <div className="ml-auto flex gap-2">
              {!editMode ? (
                <Button onClick={() => setEditMode(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

          </div>
        </Card>

        {/* PROFILE FORM */}
        <Card className="p-6 rounded-2xl shadow-sm">
          <Formik
            initialValues={{
              fullName: user.fullName || "",
              phone: user.phone || "",
            }}
            validationSchema={profileSchema}
            onSubmit={handleProfileSubmit}
          >
            {({ errors, touched }) => (
              <Form className="space-y-6">

                <div>
                  <label className="text-sm text-muted-foreground">Full Name</label>

                  {editMode ? (
                    <Field as={Input} name="fullName" className="mt-1" />
                  ) : (
                    <p className="text-lg">{user.fullName}</p>
                  )}

                  {errors.fullName && touched.fullName && (
                    <p className="text-red-500 text-sm">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Phone</label>

                  {editMode ? (
                    <Field as={Input} name="phone" className="mt-1" />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone || "Not provided"}</span>
                    </div>
                  )}

                  {errors.phone && touched.phone && (
                    <p className="text-red-500 text-sm">{errors.phone}</p>
                  )}
                </div>

                {editMode && (
                  <Button type="submit" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                )}

              </Form>
            )}
          </Formik>
        </Card>

        {/* CHANGE PASSWORD */}
        <Card className="p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">
                Update your password regularly to keep your account secure
              </p>
            </div>

            <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </div>
        </Card>

      </div>

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-background p-6 rounded-2xl w-full max-w-md shadow-xl">

            <h2 className="text-xl font-bold mb-4">Change Password</h2>

            <Formik
              initialValues={{
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={passwordSchema}
              onSubmit={handleChangePassword}
            >
              {({ errors, touched }) => (
                <Form className="space-y-4">

                  <Field
                    as={Input}
                    type="password"
                    name="currentPassword"
                    placeholder="Current Password"
                  />
                  {errors.currentPassword && touched.currentPassword && (
                    <p className="text-red-500 text-sm">{errors.currentPassword}</p>
                  )}

                  <Field
                    as={Input}
                    type="password"
                    name="newPassword"
                    placeholder="New Password"
                  />
                  {errors.newPassword && touched.newPassword && (
                    <p className="text-red-500 text-sm">{errors.newPassword}</p>
                  )}

                  <Field
                    as={Input}
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1" disabled={loadingPassword}>
                      {loadingPassword ? "Updating..." : "Update"}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowPasswordModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>

                </Form>
              )}
            </Formik>

          </div>
        </div>
      )}

    </div>
  )
}

export default UserProfile