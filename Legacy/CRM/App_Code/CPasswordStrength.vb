Imports Microsoft.VisualBasic

Public Class CPasswordStrength
    Private _hasUpperCaseLetters As Boolean = True
    Private _minimumPasswordLength As Integer = 6
    Private _hasLowerCaseLetters As Boolean
    Private _hasSpecialCharacters As Boolean = True
    Private _hasNumericCharacters As Boolean
    Private _numberofChecktoSucceed As Integer = 2
    Private _reasonFailed As String = String.Empty
    Public ReadOnly Property Reasonfailed() As String
        Get
            Return _reasonFailed
        End Get
    End Property


    Public ReadOnly Property HasNumericCharacters() As Boolean
        Get
            Return _hasNumericCharacters
        End Get
    End Property
    Public Property NumberofChecktoSucceed() As Integer
        Get
            Return _numberofChecktoSucceed
        End Get
        Set(ByVal value As Integer)
            _numberofChecktoSucceed = value
        End Set

    End Property
    Public Property MinimumPasswordLength() As Integer
        Get
            Return _minimumPasswordLength
        End Get
        Set(ByVal value As Integer)
            _minimumPasswordLength = value
        End Set
    End Property
    Public ReadOnly Property HasSpecialCharacters() As Boolean
        Get
            Return _hasSpecialCharacters
        End Get
    End Property
    Public ReadOnly Property HasLowerCaseLetters() As Boolean
        Get
            Return _hasLowerCaseLetters
        End Get
    End Property
    Public ReadOnly Property HasUpperCaseLetters() As Boolean
        Get
            Return _hasUpperCaseLetters
        End Get
    End Property

    Public Function isPasswordStrong(ByVal Password As String) As Boolean
        _hasNumericCharacters = False
        _hasUpperCaseLetters = False
        _hasLowerCaseLetters = False
        _hasSpecialCharacters = False
        If Password.Length < MinimumPasswordLength Then _reasonFailed = "Password has failed to meet the criteria!" & vbCrLf & "Atleast " & MinimumPasswordLength & " characters to qualify." : Return False
        Dim ln As Integer = Password.Length
        For ln = 1 To Password.Length
            Select Case Asc(Mid(Password, ln, 1))
                Case 48 To 57
                    _hasNumericCharacters = True
                Case 65 To 90
                    _hasUpperCaseLetters = True
                Case 97 To 122
                    _hasLowerCaseLetters = True
                Case Else
                    _hasSpecialCharacters = True
            End Select
        Next
        ln = 0
        If _hasLowerCaseLetters = True Then
            ln += 1
        End If
        If _hasUpperCaseLetters = True Then
            ln += 1
        End If
        If _hasSpecialCharacters = True Then
            ln += 1
        End If
        If _hasNumericCharacters = True Then
            ln += 1
        End If
        ''If ln < _numberofChecktoSucceed Then
        ''    _reasonFailed = "The Password failed to meet the criteria!" & vbCrLf & _
        ''                    "The number of complexity checks required to pass is " & _numberofChecktoSucceed

        If ln < _numberofChecktoSucceed Then
            _reasonFailed = "The Password failed to meet the required criteria!.Must have atleast one Numeric,uppercase,Lowercase and special characters"

            Return False
        End If
        Return True
    End Function

End Class
