
#ifndef TRAIN_H
#define TRAIN_H

#include <string>

using namespace std;

class Train {
private:
    string trainNumber;
    string trainName;
    string source;
    string destination;
    string departureTime;
    string arrivalTime;
    double fare;
    int totalSeats;
    int availableSeats;

public:
    Train();
    
    Train(
        string number,
        string name,
        string from,
        string to,
        string departure,
        string arrival,
        double ticketFare,
        int seats
    );

    string getTrainNumber() const;
    string getTrainName() const;
    string getSource() const;
    string getDestination() const;
    string getDepartureTime() const;
    string getArrivalTime() const;

    double getFare() const;
    int getTotalSeats() const;
    int getAvailableSeats() const;

    void setAvailableSeats(int seats);
    void display() const;
};

#endif
