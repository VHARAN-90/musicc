import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { YouTubeVideo } from '../types/youtube';
import { useSupabaseAuth } from './useSupabaseAuth';

interface DatabasePlaylist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tracks: DatabaseTrack[];
}

interface DatabaseTrack {
  id: string;
  track_id: string;
  track_title: string;
  track_channel: string;
  track_thumbnail: string;
  track_duration: string;
  position: number;
  added_at: string;
}

export const useSupabasePlaylists = () => {
  const { user } = useSupabaseAuth();
  const [playlists, setPlaylists] = useState<DatabasePlaylist[]>([]);
  const [likedSongs, setLikedSongs] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);

  // Convert database track to YouTubeVideo
  const dbTrackToYouTubeVideo = (track: DatabaseTrack): YouTubeVideo => ({
    id: track.track_id,
    title: track.track_title,
    channelTitle: track.track_channel,
    thumbnails: {
      default: { url: track.track_thumbnail, width: 120, height: 90 },
      medium: { url: track.track_thumbnail, width: 320, height: 180 },
      high: { url: track.track_thumbnail, width: 480, height: 360 },
    },
    duration: track.track_duration,
    publishedAt: track.added_at,
  });

  // Load playlists from database
  const loadPlaylists = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch playlists with tracks
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select(`
          id,
          name,
          description,
          is_public,
          created_at,
          updated_at,
          playlist_tracks (
            id,
            track_id,
            track_title,
            track_channel,
            track_thumbnail,
            track_duration,
            position,
            added_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      const formattedPlaylists = playlistsData?.map(playlist => ({
        ...playlist,
        tracks: playlist.playlist_tracks
          .sort((a, b) => a.position - b.position)
          .map(track => ({ ...track })),
      })) || [];

      setPlaylists(formattedPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load liked songs from database
  const loadLikedSongs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('liked_songs')
        .select('*')
        .eq('user_id', user.id)
        .order('liked_at', { ascending: false });

      if (error) throw error;

      const formattedLikedSongs = data?.map(song => ({
        id: song.track_id,
        title: song.track_title,
        channelTitle: song.track_channel,
        thumbnails: {
          default: { url: song.track_thumbnail, width: 120, height: 90 },
          medium: { url: song.track_thumbnail, width: 320, height: 180 },
          high: { url: song.track_thumbnail, width: 480, height: 360 },
        },
        duration: song.track_duration,
        publishedAt: song.liked_at,
      })) || [];

      setLikedSongs(formattedLikedSongs);
    } catch (error) {
      console.error('Error loading liked songs:', error);
    }
  };

  // Create new playlist
  const createPlaylist = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name,
          description,
        })
        .select()
        .single();

      if (error) throw error;

      const newPlaylist = {
        ...data,
        tracks: [],
      };

      setPlaylists(prev => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  };

  // Delete playlist
  const deletePlaylist = async (playlistId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  // Add track to playlist
  const addToPlaylist = async (playlistId: string, track: YouTubeVideo) => {
    if (!user) return;

    try {
      // Get current track count for position
      const { count } = await supabase
        .from('playlist_tracks')
        .select('*', { count: 'exact', head: true })
        .eq('playlist_id', playlistId);

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: track.id,
          track_title: track.title,
          track_channel: track.channelTitle,
          track_thumbnail: track.thumbnails.medium.url,
          track_duration: track.duration,
          position: count || 0,
        });

      if (error) throw error;

      // Reload playlists to get updated data
      await loadPlaylists();
    } catch (error) {
      console.error('Error adding track to playlist:', error);
    }
  };

  // Remove track from playlist
  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) throw error;

      // Reload playlists to get updated data
      await loadPlaylists();
    } catch (error) {
      console.error('Error removing track from playlist:', error);
    }
  };

  // Toggle liked song
  const toggleLikedSong = async (track: YouTubeVideo) => {
    if (!user) return;

    const isLiked = likedSongs.some(song => song.id === track.id);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('liked_songs')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', track.id);

        if (error) throw error;

        setLikedSongs(prev => prev.filter(song => song.id !== track.id));
      } else {
        const { error } = await supabase
          .from('liked_songs')
          .insert({
            user_id: user.id,
            track_id: track.id,
            track_title: track.title,
            track_channel: track.channelTitle,
            track_thumbnail: track.thumbnails.medium.url,
            track_duration: track.duration,
          });

        if (error) throw error;

        setLikedSongs(prev => [track, ...prev]);
      }
    } catch (error) {
      console.error('Error toggling liked song:', error);
    }
  };

  // Check if track is liked
  const isTrackLiked = (trackId: string): boolean => {
    return likedSongs.some(song => song.id === trackId);
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadPlaylists();
      loadLikedSongs();
    } else {
      setPlaylists([]);
      setLikedSongs([]);
    }
  }, [user]);

  return {
    playlists,
    likedSongs,
    loading,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    toggleLikedSong,
    isTrackLiked,
    loadPlaylists,
    loadLikedSongs,
  };
};