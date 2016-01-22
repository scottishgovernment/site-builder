# Returns the path to the YAML file for the given url
normalize() {
  id="${1%/}/"
  printf "$id\n"
}
yaml() {
  local id=$(normalize $1)
  grep -l ^url:\ $id\$ out/contentitems/*.yaml | head -1
}
id() {
  yaml $1 | cut -d/ -f3 | cut -d. -f1
}
