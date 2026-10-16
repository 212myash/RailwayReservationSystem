
#ifndef DSA_H
#define DSA_H

#include "Train.h"
#include "Station.h"
#include "Booking.h"

#include <string>
#include <vector>

using namespace std;

// Search.cpp
string toLowerCase(string text);

int linearSearchTrain(
    const vector<Train>& trains,
    const string& trainNumber
);

int binarySearchTrain(
    const vector<Train>& trains,
    const string& trainNumber
);

vector<int> searchTrainsByRoute(
    const vector<Train>& trains,
    const string& source,
    const string& destination
);

int linearSearchStation(
    const vector<Station>& stations,
    const string& stationCode
);

vector<int> searchStationsByName(
    const vector<Station>& stations,
    const string& query
);

// Sorting.cpp
void bubbleSortTrainsByNumber(vector<Train>& trains);
void insertionSortTrainsByFare(vector<Train>& trains);

// Reservation.cpp
bool isValidSeat(int seatNumber, int totalSeats);

int allocateSeat(const vector<bool>& occupiedSeats);

vector<int> allocateSeats(
    const vector<bool>& occupiedSeats,
    int requiredSeats
);

bool validateSeatSelection(
    const vector<int>& seats,
    int totalSeats
);

bool areSeatsAvailable(
    const vector<bool>& occupiedSeats,
    const vector<int>& requestedSeats
);

bool reserveSeats(
    vector<bool>& occupiedSeats,
    const vector<int>& requestedSeats
);

bool releaseSeats(
    vector<bool>& occupiedSeats,
    const vector<int>& seatsToRelease
);

double calculateTotalFare(
    double farePerPassenger,
    int passengerCount
);

// File handling: FileManager.cpp
bool loadTrainsFromFile(
    const string& filename,
    vector<Train>& trains
);

bool loadStationsFromFile(
    const string& filename,
    vector<Station>& stations
);

string generatePNR(const vector<Booking>& bookings);

bool saveBookingToFile(
    const string& filename,
    const Booking& booking
);

#endif