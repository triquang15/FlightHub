import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Formik, Form, Field } from "formik"
import * as Yup from "yup"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  changePassword,
  deleteUserAvatar,
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
} from "@/Redux/user/userThunks"

import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Fingerprint,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react"

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"]

const profileSchema = Yup.object({
  fullName: Yup.string().required("Required").min(3, "Min 3 characters"),
  phone: Yup.string()
    .matches(/^\+?[0-9]{7,15}$/, {
      message: "Invalid phone",
      excludeEmptyString: true,
    })
    .nullable(),
})

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required("Required"),
  newPassword: Yup.string()
    .min(8, "Min 8 characters")
    .max(64, "Max 64 characters")
    .matches(/(?=.*[a-z])/, "Add a lowercase letter")
    .matches(/(?=.*[A-Z])/, "Add an uppercase letter")
    .matches(/(?=.*\d)/, "Add a number")
    .notOneOf([Yup.ref("currentPassword")], "New password must be different")
    .required("Required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Required"),
})

const formatRole = (role) =>
  role ? role.replace("ROLE_", "").replaceAll("_", " ") : "Traveler"

const formatProvider = (provider) => {
  switch (provider) {
    case "GOOGLE":
      return "Google"
    case "FACEBOOK":
      return "Facebook"
    case "APPLE":
      return "Apple"
    case "PASSWORD":
      return "Password"
    default:
      return provider || "Password"
  }
}

const formatDate = (value) => {
  if (!value) return "Not available"

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

const getInitials = (name) => {
  if (!name) return "U"

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-md border bg-background px-4 py-3">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">{value || "Not provided"}</p>
    </div>
  </div>
)

const LoginMethodBadge = ({ provider }) => {
  const label = formatProvider(provider)
  const className = {
    GOOGLE: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
    FACEBOOK: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
    APPLE: "border-slate-300 bg-slate-950 text-white dark:border-slate-700 dark:bg-white dark:text-slate-950",
    PASSWORD: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  }[provider] || "border-border bg-muted text-muted-foreground"

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      <KeyRound className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}

const passwordRules = [
  {
    label: "8 to 64 characters",
    test: (value) => value.length >= 8 && value.length <= 64,
  },
  {
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    label: "One lowercase letter",
    test: (value) => /[a-z]/.test(value),
  },
  {
    label: "One number",
    test: (value) => /\d/.test(value),
  },
]

const PasswordField = ({ id, name, label, autoComplete, visible, onToggle }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium" htmlFor={id}>
      {label}
    </label>
    <div className="relative">
      <Field
        as={Input}
        id={id}
        type={visible ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
        onClick={onToggle}
        aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  </div>
)

const UserProfile = ({
  embedded = false,
  eyebrow = "Account settings",
  title = "Profile",
  description = "Manage your personal details and account security.",
}) => {
  const dispatch = useDispatch()
  const authUser = useSelector((state) => state.auth.user)
  const { userProfile, loading, profileError } = useSelector((state) => state.user)
  const user = userProfile || authUser

  const [editMode, setEditMode] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  })
  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (!userProfile) {
      dispatch(getUserProfile())
    }
  }, [dispatch, userProfile])

  if (!user) {
    return (
      <main className="flex min-h-64 items-center justify-center rounded-xl border bg-card px-4">
        <p className="text-sm text-muted-foreground">
          {profileError || "Loading profile..."}
        </p>
      </main>
    )
  }

  const handleProfileSubmit = async (values) => {
    try {
      await dispatch(updateUserProfile({
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || null,
      })).unwrap()
      setEditMode(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleChangePassword = async (values) => {
    try {
      setLoadingPassword(true)

      await dispatch(changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })).unwrap()
      setShowPasswordModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, or WEBP image")
      return
    }

    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Profile photo must be 5MB or smaller")
      return
    }

    try {
      setAvatarUploading(true)
      await dispatch(uploadUserAvatar(file)).unwrap()
    } catch (err) {
      console.error(err)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true)
      await dispatch(deleteUserAvatar()).unwrap()
    } catch (err) {
      console.error(err)
    } finally {
      setAvatarUploading(false)
    }
  }

  const togglePasswordVisibility = (key) => {
    setVisiblePasswords((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  const closePasswordModal = () => {
    if (loadingPassword) return

    setShowPasswordModal(false)
    setVisiblePasswords({
      current: false,
      next: false,
      confirm: false,
    })
  }

  const avatarSrc = user.avatarUrl || user.profilePicture
  const loginProviders = Array.isArray(user.loginProviders) && user.loginProviders.length > 0
    ? user.loginProviders
    : ["PASSWORD"]
  const lastLoginProvider = user.lastLoginProvider || loginProviders[0]
  const lastProviderLoginAt = user.lastProviderLoginAt || user.lastLogin
  const hasPasswordLogin = loginProviders.includes("PASSWORD")

  return (
    <main className={embedded ? "w-full" : "app-page-surface min-h-screen px-4 py-8 sm:px-6 lg:px-8"}>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 px-5 py-7 text-white sm:px-7">
            <p className="text-sm font-medium text-slate-300">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{description}</p>
          </div>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <p className="text-sm text-muted-foreground">
              Email and role are managed by the platform and cannot be edited here.
            </p>
            {!editMode ? (
              <Button onClick={() => setEditMode(true)} disabled={loading}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit profile
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel editing
              </Button>
            )}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="rounded-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border shadow-sm">
                      <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-2xl font-semibold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading || loading}
                      className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label="Upload profile photo"
                      title="Upload profile photo"
                    >
                      {avatarUploading ? (
                        <Upload className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <h2 className="mt-4 max-w-full truncate text-xl font-semibold">
                    {user.fullName || "Unnamed user"}
                  </h2>
                  <p className="mt-1 max-w-full truncate text-sm text-muted-foreground">
                    {user.email}
                  </p>

                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary">{formatRole(user.role)}</Badge>
                    <Badge variant={user.active === false ? "destructive" : "outline"}>
                      {user.active === false ? "Inactive" : "Active"}
                    </Badge>
                    {user.verified && (
                      <Badge variant="outline">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="mt-5 flex w-full flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading || loading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {user.hasCustomAvatar ? "Change photo" : "Upload photo"}
                    </Button>
                    {user.hasCustomAvatar && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading || loading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove photo
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {user.hasCustomAvatar
                      ? "Stored as your FlightHub profile photo."
                      : avatarSrc
                        ? "Using your connected account photo until you upload one."
                        : "JPG, PNG, or WEBP. Maximum 5MB."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardContent className="space-y-3 p-6">
                <DetailRow icon={ShieldCheck} label="Role" value={formatRole(user.role)} />
                <DetailRow icon={CalendarDays} label="Member since" value={formatDate(user.createdAt)} />
                <DetailRow icon={Clock3} label="Last login" value={formatDate(user.lastLogin)} />
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardContent className="space-y-4 p-6">
                <div>
                  <h2 className="text-base font-semibold">Login methods</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connected sign-in methods for this account.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {loginProviders.map((provider) => (
                    <LoginMethodBadge key={provider} provider={provider} />
                  ))}
                </div>
                <div className="grid gap-3">
                  <DetailRow
                    icon={Fingerprint}
                    label="Last method"
                    value={`${formatProvider(lastLoginProvider)} · ${formatDate(lastProviderLoginAt)}`}
                  />
                  <DetailRow
                    icon={ImageIcon}
                    label="Profile photo source"
                    value={user.hasCustomAvatar ? "Uploaded profile photo" : avatarSrc ? "Connected account photo" : "Initials fallback"}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-6">
            <Card className="rounded-lg">
              <CardContent className="p-6">
                <div className="flex flex-col gap-1 border-b pb-5">
                  <h2 className="text-lg font-semibold">Personal information</h2>
                  <p className="text-sm text-muted-foreground">
                      Keep your contact details current for account recovery and operational communication.
                  </p>
                </div>

                <Formik
                  initialValues={{
                    fullName: user.fullName || "",
                    phone: user.phone || "",
                  }}
                  enableReinitialize
                  validationSchema={profileSchema}
                  onSubmit={handleProfileSubmit}
                >
                  {({ errors, touched, isSubmitting, dirty }) => (
                    <Form className="mt-6 space-y-6">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="fullName">
                            Full name
                          </label>
                          {editMode ? (
                            <Field
                              as={Input}
                              id="fullName"
                              name="fullName"
                              autoComplete="name"
                            />
                          ) : (
                            <div className="flex min-h-10 items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{user.fullName || "Not provided"}</span>
                            </div>
                          )}
                          {errors.fullName && touched.fullName && (
                            <p className="text-sm text-destructive">{errors.fullName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="email">
                            Email
                          </label>
                          <div className="flex min-h-10 items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="min-w-0 truncate">{user.email}</span>
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium" htmlFor="phone">
                            Phone number
                          </label>
                          {editMode ? (
                            <Field
                              as={Input}
                              id="phone"
                              name="phone"
                              inputMode="tel"
                              autoComplete="tel"
                              placeholder="+14155552671"
                            />
                          ) : (
                            <div className="flex min-h-10 items-center gap-2 rounded-md border bg-muted/30 px-3 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{user.phone || "Not provided"}</span>
                            </div>
                          )}
                          {errors.phone && touched.phone && (
                            <p className="text-sm text-destructive">{errors.phone}</p>
                          )}
                        </div>
                      </div>

                      {editMode && (
                        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditMode(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting || !dirty}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting ? "Saving..." : "Save changes"}
                          </Button>
                        </div>
                      )}
                    </Form>
                  )}
                </Formik>
              </CardContent>
            </Card>

            <Card className="rounded-lg">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h2 className="font-semibold">Security</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Update your password if you suspect unusual activity.
                    </p>
                  </div>
                </div>

                {hasPasswordLogin ? (
                  <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                    Change password
                  </Button>
                ) : (
                  <Badge variant="secondary" className="w-fit">
                    Social sign-in account
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div
            className="w-full max-w-lg rounded-lg border bg-background p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="change-password-title" className="text-lg font-semibold">
                  Change password
                </h2>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Use a strong password you do not use anywhere else.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closePasswordModal}
                disabled={loadingPassword}
                aria-label="Close password dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Formik
              initialValues={{
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              }}
              validationSchema={passwordSchema}
              onSubmit={handleChangePassword}
            >
              {({ errors, touched, values, isSubmitting }) => (
                <Form className="space-y-4">
                  <PasswordField
                    id="currentPassword"
                    name="currentPassword"
                    label="Current password"
                    autoComplete="current-password"
                    visible={visiblePasswords.current}
                    onToggle={() => togglePasswordVisibility("current")}
                  />
                  {errors.currentPassword && touched.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword}</p>
                  )}

                  <PasswordField
                    id="newPassword"
                    name="newPassword"
                    label="New password"
                    autoComplete="new-password"
                    visible={visiblePasswords.next}
                    onToggle={() => togglePasswordVisibility("next")}
                  />
                  {errors.newPassword && touched.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}

                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Password requirements
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {passwordRules.map((rule) => {
                        const passed = rule.test(values.newPassword || "")

                        return (
                          <div key={rule.label} className="flex items-center gap-2 text-sm">
                            <CheckCircle2
                              className={`h-4 w-4 ${
                                passed ? "text-emerald-600" : "text-muted-foreground/50"
                              }`}
                            />
                            <span className={passed ? "text-foreground" : "text-muted-foreground"}>
                              {rule.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <PasswordField
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm password"
                    autoComplete="new-password"
                    visible={visiblePasswords.confirm}
                    onToggle={() => togglePasswordVisibility("confirm")}
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closePasswordModal}
                      disabled={loadingPassword || isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loadingPassword || isSubmitting}>
                      {loadingPassword ? "Updating..." : "Update password"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </main>
  )
}

export default UserProfile
