export const portableTextFields = `{
  ...,
  markDefs[]{
    ...,
    _type == "internalLink" => {
      "slug": @.reference->slug.current,
      "refType": @.reference->_type
    },
    _type == "link" => {
      ...,
    }
  }
}`;
