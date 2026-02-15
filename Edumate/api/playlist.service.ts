import client from "./client";

export const PlaylistAPI={
 getPlayLists:async() => {
  console.log("API getPlayLists called");
  return client.get("/api/playlists");
}

};



