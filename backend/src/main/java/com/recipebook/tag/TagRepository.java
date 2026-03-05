package com.recipebook.tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface TagRepository extends JpaRepository<TagEntity, UUID> {

    boolean existsByNameIgnoreCase(String name);

    Optional<TagEntity> findByNameIgnoreCase(String name);

    Set<TagEntity> findAllByIdIn(Set<UUID> ids);

    List<TagEntity> findAllByOrderByNameAsc();
}
