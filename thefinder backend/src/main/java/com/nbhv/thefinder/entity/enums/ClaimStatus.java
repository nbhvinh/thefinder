package com.nbhv.thefinder.entity.enums;

public enum ClaimStatus {
    SUBMITTED,
    PENDING,
    REVIEWING, // Trạng thái cũ, giữ để đọc dữ liệu đã tạo trước khi đổi flow.
    CONFIRMED,
    REJECTED
}
