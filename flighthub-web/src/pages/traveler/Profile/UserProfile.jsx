import { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Formik, Form, Field } from "formik"
import * as Yup from "yup"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  changePassword,
  deleteUserAvatar,
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
} from "@/Redux/user/userThunks"

import {
  Camera,
  CheckCircle2,
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

const DetailRow = ({ icon: Icon, label, value, compact = false }) => (
  <div className={`flex items-start gap-3 rounded-lg border border-border/70 bg-background/70 ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
    <div className={`${compact ? "h-8 w-8" : "mt-0.5 h-9 w-9"} flex shrink-0 items-center justify-center rounded-md bg-primary/10`}>
      <Icon className="h-4 w-4 text-primary" />
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
      <div className="mx-auto max-w-[1380px] space-y-5">
        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm">
          <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="border-b bg-gradient-to-br from-primary/10 via-card to-muted/40 p-6 text-foreground dark:from-primary/15 dark:via-card dark:to-muted/20 lg:border-b-0 lg:border-r">
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    <Avatar className="h-24 w-24 border border-border shadow-lg">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                        {getInitials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading || loading}
                      className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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

                  <div className="min-w-0 pt-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                      {eyebrow}
                    </p>
                    <h2 className="mt-2 truncate text-2xl font-semibold">
                      {user.fullName || "Unnamed user"}
                    </h2>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="border-border bg-background/70 text-foreground hover:bg-background/70">
                        {formatRole(user.role)}
                      </Badge>
                      <Badge className={user.active === false ? "bg-red-500 text-white" : "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-200"}>
                        {user.active === false ? "Inactive" : "Active"}
                      </Badge>
                      {user.verified && (
                        <Badge className="bg-sky-500/15 text-sky-700 hover:bg-sky-500/15 dark:text-sky-200">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 rounded-xl border border-border/70 bg-background/60 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Member since</p>
                      <p className="mt-1 text-sm font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last login</p>
                      <p className="mt-1 text-sm font-medium">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                  <div className="border-t border-border/70 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sign-in methods</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {loginProviders.map((provider) => (
                        <LoginMethodBadge key={provider} provider={provider} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading || loading}
                    className="justify-center"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {user.hasCustomAvatar ? "Change photo" : "Upload photo"}
                  </Button>
                  {user.hasCustomAvatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleRemoveAvatar}
                      disabled={avatarUploading || loading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove photo
                    </Button>
                  )}
                  <p className="text-xs leading-5 text-muted-foreground">
                    {user.hasCustomAvatar
                      ? "Stored as your FlightHub profile photo."
                      : avatarSrc
                        ? "Using your connected account photo until you upload one."
                        : "JPG, PNG, or WEBP. Maximum 5MB."}
                  </p>
                </div>
              </div>
            </aside>

            <div className="min-w-0 p-5 sm:p-7">
              <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Email and role are managed by the platform and cannot be edited here.
                  </p>
                </div>
                {!editMode ? (
                  <Button onClick={() => setEditMode(true)} disabled={loading} className="shrink-0">
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit profile
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setEditMode(false)} className="shrink-0">
                    <X className="mr-2 h-4 w-4" />
                    Cancel editing
                  </Button>
                )}
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
                    <div className="grid gap-4 xl:grid-cols-3">
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
                          <div className="flex min-h-10 items-center gap-2 rounded-lg border bg-muted/25 px-3 text-sm">
                            <User className="h-4 w-4 text-primary" />
                            <span className="min-w-0 truncate">{user.fullName || "Not provided"}</span>
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
                        <div className="flex min-h-10 items-center gap-2 rounded-lg border bg-muted/25 px-3 text-sm">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="min-w-0 truncate" title={user.email}>{user.email}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
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
                          <div className="flex min-h-10 items-center gap-2 rounded-lg border bg-muted/25 px-3 text-sm">
                            <Phone className="h-4 w-4 text-primary" />
                            <span className="min-w-0 truncate">{user.phone || "Not provided"}</span>
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

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Fingerprint className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold">Account access</h2>
                      <p className="text-sm text-muted-foreground">Provider and profile source details.</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <DetailRow
                      compact
                      icon={KeyRound}
                      label="Last method"
                      value={`${formatProvider(lastLoginProvider)} · ${formatDate(lastProviderLoginAt)}`}
                    />
                    <DetailRow
                      compact
                      icon={ImageIcon}
                      label="Profile photo source"
                      value={user.hasCustomAvatar ? "Uploaded profile photo" : avatarSrc ? "Connected account photo" : "Initials fallback"}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex h-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-start 2xl:flex-row 2xl:items-center">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Lock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-semibold">Security</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Update your password if you suspect unusual activity.
                        </p>
                      </div>
                    </div>

                    {hasPasswordLogin ? (
                      <Button variant="outline" onClick={() => setShowPasswordModal(true)} className="shrink-0">
                        Change password
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="w-fit">
                        Social sign-in account
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
