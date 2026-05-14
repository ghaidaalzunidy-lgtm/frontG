"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Mail, Phone, Briefcase, User, X, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useApp, useUser, translations, departments } from "@/lib/app-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function HRProfile() {
  const { language, addToast } = useApp();
  const { user, updateUser } = useUser();
  const t = translations[language];

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [editBio, setEditBio] = useState(user?.bio || "");
  const [editPosition, setEditPosition] = useState(user?.position || "");
  const [editDepartment, setEditDepartment] = useState(user?.department || "");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleStartEdit = () => {
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditBio(user?.bio || "");
    setEditPosition(user?.position || "");
    setEditDepartment(user?.department || "");
    setIsEditing(true);
  };

  const handleSave = () => {
    updateUser({
      name: editName,
      phone: editPhone,
      bio: editBio,
      position: editPosition,
      department: editDepartment,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.profileSettings}
        </h1>
        <p className="text-muted-foreground">{t.manageAccount}</p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-primary/80 to-accent/60" />

        <CardContent className="relative px-6 pb-6">
          {/* Avatar */}
          <div
            className={`absolute -top-16 ${language === "en" ? "left-6" : "right-6"}`}
          >
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-card text-primary text-2xl">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Edit Button */}
          <div className="flex justify-end pt-4">
            <div
              className={`text-sm text-muted-foreground ${language === "en" ? "mr-4" : "ml-4"} pt-2`}
            >
              {user?.position || "HR Manager"}
            </div>
            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.div
                  key="edit-actions"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-2"
                >
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="gap-2 cursor-pointer"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                    {t.cancel}
                  </Button>
                  <Button onClick={handleSave} className="gap-2 cursor-pointer">
                    <Check className="h-4 w-4" strokeWidth={1.5} />
                    {t.saveChanges}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="edit-button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    onClick={handleStartEdit}
                    className="gap-2 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.5} />
                    {t.editProfile}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Info Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {language === "en" ? "Name" : "الاسم"}
              </Label>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={
                    language === "en" ? "Enter your name" : "أدخل اسمك"
                  }
                />
              ) : (
                <p className="text-foreground font-medium">{user?.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {t.position}
              </Label>
              {isEditing ? (
                <Input
                  value={editPosition}
                  onChange={(e) => setEditPosition(e.target.value)}
                  placeholder={
                    language === "en" ? "Enter your position" : "أدخل منصبك"
                  }
                />
              ) : (
                <div className="flex items-center gap-2 text-foreground">
                  <Briefcase
                    className="h-4 w-4 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  {user?.position || "HR Manager"}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.email}</Label>
              <div className="flex items-center gap-2 text-foreground">
                <Mail
                  className="h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
                {user?.email}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{t.role}</Label>
              <div className="flex items-center gap-2 text-foreground">
                <User
                  className="h-4 w-4 text-muted-foreground"
                  strokeWidth={1.5}
                />
                {language === "en" ? "Management" : "إدارة"}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {t.phoneNumber}
              </Label>
              {isEditing ? (
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <div className="flex items-center gap-2 text-foreground">
                  <Phone
                    className="h-4 w-4 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  {user?.phone || "+1 (555) 123-4567"}
                </div>
              )}
            </div>

            {user?.role === "employee" && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {t.department}
                </Label>
                {isEditing ? (
                  <Select
                    value={editDepartment}
                    onValueChange={setEditDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          language === "en" ? "Select department" : "اختر القسم"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem
                          key={dept}
                          value={dept}
                          className="cursor-pointer"
                        >
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-foreground">{user?.department}</p>
                )}
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm text-muted-foreground">
                {language === "en" ? "Bio" : "نبذة"}
              </Label>
              {isEditing ? (
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder={
                    language === "en"
                      ? "Tell us about yourself..."
                      : "أخبرنا عن نفسك..."
                  }
                  rows={3}
                />
              ) : (
                <p className="text-foreground text-sm">
                  {user?.bio ||
                    "Dedicated HR professional focused on creating a positive and supportive work environment for all employees."}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="border-0 shadow-md bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t.accountSettings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <h4 className="font-medium text-foreground">
                {t.emailNotifications}
              </h4>
              <p className="text-sm text-muted-foreground">{t.receiveAlerts}</p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div>
              <h4 className="font-medium text-foreground">{t.weeklyReports}</h4>
              <p className="text-sm text-muted-foreground">{t.receiveWeekly}</p>
            </div>
            <Switch
              checked={weeklyReports}
              onCheckedChange={setWeeklyReports}
              className="cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

