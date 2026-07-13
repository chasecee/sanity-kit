const markDefs = `markDefs[]{
  ...,
  _type == "internalLink" => {
    "slug": @.reference->slug.current,
    "refType": @.reference->_type
  },
  _type == "link" => {
    ...,
  }
}`;

const fileAsset = `asset->{
  _id,
  url,
  mimeType,
  originalFilename,
  size
}`;

const posterFields = `poster{
  ...,
  asset->{
    _id,
    url,
    mimeType,
    metadata{
      dimensions
    }
  }
}`;

const mediaFields = `_type == "media" => {
  ...,
  media{
    ...,
    ${fileAsset}
  }
}`;

const videoFileFields = `_type == "videoFile" => {
  ...,
  ${fileAsset},
  ${posterFields}
}`;

const galleryFields = `_type == "gallery" => {
  ...,
  images[]{
    ...,
    _type == "galleryVideo" => {
      ...,
      ${fileAsset},
      ${posterFields}
    }
  }
}`;

export const portableTextProjections = `
  ...,
  ${markDefs},
  ${mediaFields},
  ${videoFileFields},
  ${galleryFields},
  _type == "columns" => {
    ...,
    columns[]{
      ...,
      content[]{
        ...,
        ${markDefs},
        ${mediaFields},
        ${videoFileFields},
        ${galleryFields}
      }
    }
  }
`;

export const portableTextFields = `{${portableTextProjections}}`;
