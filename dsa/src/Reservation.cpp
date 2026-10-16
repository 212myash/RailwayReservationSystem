
#include "../include/Train.h"
#include "../include/Booking.h"

#include <algorithm>
#include <string>
#include <vector>

using namespace std;

// Check whether a seat number is valid.
bool isValidSeat(int seatNumber, int totalSeats) {
    return seatNumber >= 1 && seatNumber <= totalSeats;
}

// Find the first available seat.
// Time Complexity: O(n)
int allocateSeat(const vector<bool>& occupiedSeats) {
    for (size_t i = 0; i < occupiedSeats.size(); i++) {
        if (!occupiedSeats[i]) {
            return static_cast<int>(i) + 1;
        }
    }

    return -1;
}

// Allocate multiple available seats.
// Returns an empty vector if there are not enough seats.
vector<int> allocateSeats(
    const vector<bool>& occupiedSeats,
    int requiredSeats
) {
    vector<int> selectedSeats;

    if (requiredSeats <= 0) {
        return selectedSeats;
    }

    for (size_t i = 0; i < occupiedSeats.size(); i++) {
        if (!occupiedSeats[i]) {
            selectedSeats.push_back(
                static_cast<int>(i) + 1
            );
        }

        if (static_cast<int>(selectedSeats.size()) ==
            requiredSeats) {
            return selectedSeats;
        }
    }

    // Not enough seats: do not return a partial allocation.
    selectedSeats.clear();
    return selectedSeats;
}

// Validate that requested seats are valid and distinct.
// Time Complexity: O(k^2), where k is the number of seats.
bool validateSeatSelection(
    const vector<int>& seats,
    int totalSeats
) {
    for (size_t i = 0; i < seats.size(); i++) {
        if (!isValidSeat(seats[i], totalSeats)) {
            return false;
        }

        for (size_t j = i + 1; j < seats.size(); j++) {
            if (seats[i] == seats[j]) {
                return false;
            }
        }
    }

    return !seats.empty();
}

// Check whether all requested seats are currently free.
// Time Complexity: O(k), where k is the number of requested seats.
bool areSeatsAvailable(
    const vector<bool>& occupiedSeats,
    const vector<int>& requestedSeats
) {
    for (int seat : requestedSeats) {
        if (
            seat < 1 ||
            seat > static_cast<int>(occupiedSeats.size())
        ) {
            return false;
        }

        if (occupiedSeats[seat - 1]) {
            return false;
        }
    }

    return !requestedSeats.empty();
}

// Mark seats as occupied.
// Call only after validating the complete selection.
bool reserveSeats(
    vector<bool>& occupiedSeats,
    const vector<int>& requestedSeats
) {
    if (!validateSeatSelection(
            requestedSeats,
            static_cast<int>(occupiedSeats.size())
        )) {
        return false;
    }

    if (!areSeatsAvailable(
            occupiedSeats,
            requestedSeats
        )) {
        return false;
    }

    for (int seat : requestedSeats) {
        occupiedSeats[seat - 1] = true;
    }

    return true;
}

// Cancel a booking's seats and mark them free.
// Time Complexity: O(k)
bool releaseSeats(
    vector<bool>& occupiedSeats,
    const vector<int>& seatsToRelease
) {
    if (!validateSeatSelection(
            seatsToRelease,
            static_cast<int>(occupiedSeats.size())
        )) {
        return false;
    }

    for (int seat : seatsToRelease) {
        if (!occupiedSeats[seat - 1]) {
            return false;
        }
    }

    for (int seat : seatsToRelease) {
        occupiedSeats[seat - 1] = false;
    }

    return true;
}

// Calculate total fare for a group of passengers.
// Time Complexity: O(1)
double calculateTotalFare(
    double farePerPassenger,
    int passengerCount
) {
    if (farePerPassenger < 0 || passengerCount <= 0) {
        return 0;
    }

    return farePerPassenger * passengerCount;
}
