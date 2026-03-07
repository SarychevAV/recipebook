package com.recipebook.storage;

import java.io.InputStream;

public interface StorageService {
    String upload(String originalFilename, InputStream data, long size, String contentType);
}
