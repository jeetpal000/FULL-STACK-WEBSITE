import z from "zod";

export const loginUserSchema = z.object({
  email: z.email({ message: "Please enter a valid email adress" }).trim(),
  password: z
    .string()
    .trim()
    .min(6, { message: "password should be 6 char" })
    .max(100, { message: "password should be min 100" }),
});

export const regitserUserSchema = loginUserSchema.extend({
  name: z
    .string()
    .trim()
    .min(3, { message: "name should be greater than 3 char" })
    .max(100, { message: "name should be min 100 char" }),
});

const newPassword =z
      .string()
      .min(6, { message: "new password must ne at least 6 character long" })
      .max(100, { message: "New Password must be no more than 100 character" });


export const verifPasswordSchema = z
  .object({
    oldpassword: z.string().min(1, { message: "Current Password is required" }),
    newpassword: newPassword,
    confirmpassword: newPassword,
  })
  .refine((data) => data.newpassword === data.confirmpassword, {
    message: "Password not match",
    path: ["confirmpassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z
        .email({message: "please enter valid email address"})
        .trim()
        .max(100,{message: "Please enter valid email address"})
});

export const resetPasswordSchema = z.object({
  newpassword: newPassword,
  confirmpassword: newPassword
}).refine((data)=> data.newpassword === data.confirmpassword, {
    message: "password not match",
    path:["confirmpassword"]
})
