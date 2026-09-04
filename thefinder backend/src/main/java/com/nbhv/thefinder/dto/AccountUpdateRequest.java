package com.nbhv.thefinder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AccountUpdateRequest {
    @NotBlank(message = "Tên người dùng không được để trống")
    @Size(max = 255, message = "Tên người dùng không được vượt quá 255 ký tự")
    private String fullName;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    @Size(max = 500, message = "URL Messenger không được vượt quá 500 ký tự")
    private String messengerUrl;

    @Size(max = 500, message = "URL Zalo không được vượt quá 500 ký tự")
    private String zaloUrl;

    private boolean showPhone;
    private boolean showMessenger;
    private boolean showZalo;

    private String currentPassword;

    @Size(min = 4, max = 72, message = "Mật khẩu mới phải từ 4 đến 72 ký tự")
    private String newPassword;
}
