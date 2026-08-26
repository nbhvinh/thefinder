package com.nbhv.thefinder.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class RegisterRequest {
    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
    private String password;

    @NotBlank
    private String fullName;

    private String phone;

    // getters/setters
}