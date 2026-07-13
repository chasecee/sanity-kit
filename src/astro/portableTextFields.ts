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

const mediaFields = `_type == "media" => {
  ...,
  media{
    ...,
    ${fileAsset}
  }
}`;

const videoFileFields = `_type == "videoFile" => {
  ...,
  ${fileAsset}
}`;

export const portableTextProjections = `
  ...,
  ${markDefs},
  ${mediaFields},
  ${videoFileFields},
  _type == "columns" => {
    ...,
    columns[]{
      ...,
      content[]{
        ...,
        ${markDefs},
        ${mediaFields},
        ${videoFileFields}
      }
    }
  }
`;

export const portableTextFields = `{${portableTextProjections}}`;
