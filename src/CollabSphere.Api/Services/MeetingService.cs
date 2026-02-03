namespace CollabSphere.Api.Services;

using CollabSphere.Api.Models;
using System.Collections.Concurrent;

public class MeetingService
{
    private readonly ConcurrentDictionary<string, Meeting> _meetings = new();
    private readonly ConcurrentDictionary<string, HashSet<string>> _activeRooms = new();

    public Meeting CreateMeeting(Meeting meeting)
    {
        _meetings[meeting.Id] = meeting;
        return meeting;
    }

    public Meeting? GetMeeting(string id)
    {
        _meetings.TryGetValue(id, out var meeting);
        return meeting;
    }

    public List<Meeting> GetAllMeetings()
    {
        return _meetings.Values.ToList();
    }

    public void JoinRoom(string roomId, string userId)
    {
        if (!_activeRooms.ContainsKey(roomId))
            _activeRooms[roomId] = new HashSet<string>();
        _activeRooms[roomId].Add(userId);
    }

    public void LeaveRoom(string roomId, string userId)
    {
        if (_activeRooms.TryGetValue(roomId, out var users))
            users.Remove(userId);
    }
}