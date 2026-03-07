package com.recipebook.tag;

import com.recipebook.common.exception.DuplicateResourceException;
import com.recipebook.tag.dto.CreateTagRequest;
import com.recipebook.tag.dto.TagResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TagService {

    private final TagRepository tagRepository;
    private final TagMapper tagMapper;

    @Transactional(readOnly = true)
    public List<TagResponse> findAll() {
        return tagMapper.toResponseList(tagRepository.findAllByOrderByNameAsc());
    }

    @Transactional
    public TagResponse create(CreateTagRequest request) {
        String normalized = request.name().trim();
        if (tagRepository.existsByNameIgnoreCase(normalized)) {
            throw new DuplicateResourceException("Tag '" + normalized + "' already exists");
        }
        TagEntity tag = TagEntity.builder().name(normalized).build();
        TagEntity saved = tagRepository.save(tag);
        log.info("Tag created: id={}, name={}", saved.getId(), saved.getName());
        return tagMapper.toResponse(saved);
    }
}
