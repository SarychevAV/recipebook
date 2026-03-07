package com.recipebook.tag;

import com.recipebook.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tags")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class TagEntity extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String name;
}
