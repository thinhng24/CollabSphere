namespace CollabSphere.Api.Services;

using CollabSphere.Api.Models;
using System.Collections.Concurrent;

public class WhiteboardService
{
    private readonly ConcurrentDictionary<string, List<WhiteboardAction>> _states = new();

    public void SaveAction(WhiteboardAction action)
    {
        if (!_states.ContainsKey(action.RoomId))
            _states[action.RoomId] = new List<WhiteboardAction>();
        _states[action.RoomId].Add(action);
    }

    public List<WhiteboardAction> GetRoomState(string roomId)
    {
        return _states.TryGetValue(roomId, out var actions) ? actions : new List<WhiteboardAction>();
    }
}