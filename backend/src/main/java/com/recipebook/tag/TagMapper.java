package com.recipebook.tag;

import com.recipebook.tag.dto.TagResponse;
import org.mapstruct.Mapper;

import java.util.Collection;
import java.util.List;

@Mapper(componentModel = "spring")
public interface TagMapper {

    TagResponse toResponse(TagEntity tag);

    List<TagResponse> toResponseList(Collection<TagEntity> tags);
}
