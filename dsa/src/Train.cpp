
#include "../include/Train.h"
#include <iostream>
#include <iomanip>

using namespace std;

Train::Train()
    : fare(0), totalSeats(0), availableSeats(0) {}

Train::Train(
    string number,
    string name,
    string from,
    string to,
    string departure,
    string arrival,
    double ticketFare,
    int seats
)
    : trainNumber(number),
      trainName(name),
      source(from),
      destination(to),
      departureTime(departure),
      arrivalTime(arrival),
      fare(ticketFare),
      totalSeats(seats),
      availableSeats(seats) {}

string Train::getTrainNumber() const {
    return trainNumber;
}

string Train::getTrainName() const {
    return trainName;
}

string Train::getSource() const {
    return source;
}

string Train::getDestination() const {
    return destination;
}

string Train::getDepartureTime() const {
    return departureTime;
}

string Train::getArrivalTime() const {
    return arrivalTime;
}

double Train::getFare() const {
    return fare;
}

int Train::getTotalSeats() const {
    return totalSeats;
}

int Train::getAvailableSeats() const {
    return availableSeats;
}

void Train::setAvailableSeats(int seats) {
    if (seats >= 0 && seats <= totalSeats) {
        availableSeats = seats;
    }
}

void Train::display() const {
    cout << left
         << setw(12) << trainNumber
         << setw(25) << trainName
         << setw(15) << source
         << setw(15) << destination
         << setw(10) << departureTime
         << setw(10) << arrivalTime
         << setw(10) << fixed << setprecision(2) << fare
         << availableSeats << "/" << totalSeats
         << '\n';
}
